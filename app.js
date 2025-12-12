// app.js (MODIFIED for Trie Initialization)

require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');


// NEW: Import the Trie and the Mongoose model
const tripTrie = require('./app_api/trie');
const Trip = require('./app_api/models/travlr'); // Assuming this is your Trip model

// Define routers
var indexRouter = require('./app_server/routes/index');
var usersRouter = require('./app_server/routes/users');
var travelRouter = require('./app_server/routes/travel');
var apiRouter = require('./app_api/routes/index');

var handlebars = require('hbs');

// Bring in the database (Mongoose connection)
const mongoose = require('./app_api/models/db');
require('./app_api/config/passport');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'app_server', 'views'));

// register handlebars partials (https://www.npmjs.com/package/hbs)
handlebars.registerPartials(__dirname + '/app_server/views/partials');

app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

// Enable CORS
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
})

// Function to populate the Trie on startup
const initializeTrie = async () => {
    try {
        console.log('Initializing Trip Trie...');
        // Fetch all trips from the database
        const trips = await Trip.find({}).exec(); 
        
        // Insert each trip into the Trie structure
        trips.forEach(trip => {
            tripTrie.insert(trip.toObject()); 
        });
        console.log(`Trie initialized with ${trips.length} trips.`);
    } catch (err) {
        console.error('Error initializing Trie:', err.message);
        process.exit(1); 
    }
};

// wire-up routes to controllers
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/travel', travelRouter);
app.use('/api', apiRouter);

// MODIFIED: Only start the server after the database is connected AND the Trie is initialized
mongoose.connection.once('open', () => {
    // We only call app.listen after the Trie is fully populated.
    initializeTrie().then(() => {
        // Use default port 3000 if not defined in environment
        app.listen(process.env.PORT || 3000, () => { 
            console.log(`Server listening on port ${process.env.PORT || 3000}`);
        });
    });
});


// Catch unauthorized error and create 401
app.use((err, req, res, next) => {
  if(err.name === 'UnauthorizedError'){
    res
      .status(401)
      .json({"message": err.name + ": " + err.message});
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// The original module.exports app is kept here, but the listen call is removed/moved.
module.exports = app;