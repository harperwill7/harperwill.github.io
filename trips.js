// app_api/controllers/trips.js (MODIFIED to include booking function)

const mongoose = require('mongoose');
const Trip = require('../models/travlr'); // register model
const Model = mongoose.model('trips'); // retrieve model
const tripTrie = require('../trie'); // NEW: Import the initialized Trie

// GET /trips - lists all the trips
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client
const tripsList = async (req, res) => {
    const q = await Model
        .find({}) // return single record
        .exec();

        // Uncomment the following line to shoiw results of querey
        // on console
        // console.log(q);

    if (!q)
    { // Database returned no data
        return res
            .status(404) // HTTP status 404: Not Found
            .json(err);
    } 
    else
    {
        return res
            .status(200) // HTTP status 200: OK
            .json(q); // Return the query results
            
    }
};

// GET: /trips/:tripCode - lists a single trip
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client

const tripsFindByCode = async (req, res) => {
    const q = await Model
        .findOne({'code' : req.params.tripCode }) // return single record
        .exec();

        // Uncomment the following line to shoiw results of querey
        // on console
        // console.log(q);

    if (!q)
    { // Database returned no data
        return res
            .status(404) // HTTP status 404: Not Found
            .json(err);
    }   
    else
    {
        return res
            .status(200) // HTTP status 200: OK
            .json(q); // Return the query results
    }
};

// POST: /trips = Adds a new Trip
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client
const tripsAddTrip = async(req, res) => {
    const newTrip = new Trip({

        code: req.body.code,
        name: req.body.name,
        length: req.body.length,
        start: req.body.start,
        resort: req.body.resort,
        perPerson: req.body.perPerson,
        image: req.body.image,
        description: req.body.description,
        available_seats: req.body.available_seats || 0 // **MODIFIED** to accept/set seats

    });

    const q = await newTrip.save();

        if(!q)
        { // Database returned no data
            return res
                .status(400)
                .json(err);
        }
        else
        { // Return new trip
            return res
                .status(201)
                .json(q);
        }

        // Uncomment the following line to show results of operation
        // on the console
        // console.log(q);
};

// PUT: /trips/:tripCode - Adds a new Trip
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client 
const tripsUpdateTrip = async(req, res) => {

// Uncomment for debugging 
// console.log(req.params); 
// console.log(req.body);

    const q = await Model.findOneAndUpdate(

        { 'code' : req.params.tripCode },
        {
            code: req.body.code,
            name: req.body.name,
            length: req.body.length,
            start: req.body.start,
            resort: req.body.resort,
            perPerson: req.body.perPerson,
            image: req.body.image,
            description: req.body.description,
            available_seats: req.body.available_seats // **MODIFIED** to allow seat updates

        }
    )
    .exec();

    if(!q)
    { // Database returned no data
        return res
            .status(400)
            .json(err);
    }

    else
    { // Return resulting updated trip
        return res
            .status(201)
            .json(q);
    }

    // uncomment the following line to show results of operation
    // on console
    // console.log(q)

};


// NEW: GET /trips/search?query=... - Searches for trips using the Trie
const tripsSearch = (req, res) => {
    const { query } = req.query; // Expects a parameter like ?query=san f
    
    if (!query) {
        // If no query is provided, return an empty array or a bad request status
        return res.status(200).json([]);
    }

    // Core Enhancement: Use the O(L) Trie search instead of a database O(N) regex search
    const results = tripTrie.search(query); 

    if (results.length > 0) {
        // Successful match
        return res
            .status(200)
            .json(results);
    } else {
        // No matches found for the prefix
        return res
            .status(404) 
            .json({"message": `No trips found matching prefix: ${query}`}); 
    }
};


// **NEW FUNCTION**: Implements the transactional booking logic
const tripsBookTrip = async (req, res) => {
    const tripCode = req.params.tripCode;
    // Assuming the user's ID is stored in the JWT payload and available via req.auth
    const userId = req.auth._id; 
    const seatsToBook = parseInt(req.body.seats, 10);

    if (isNaN(seatsToBook) || seatsToBook < 1) {
        return res.status(400).json({ "message": "Invalid number of seats (must be a positive number)." });
    }

    // 1. Start a Mongoose Session and Transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 2. Check Availability and lock the document within the transaction
        const trip = await Model
            .findOne({ 'code': tripCode })
            // IMPORTANT: The session ensures this operation is part of the transaction
            .session(session); 

        if (!trip) {
            await session.abortTransaction();
            return res.status(404).json({ "message": "Trip not found." });
        }

        if (trip.available_seats < seatsToBook) {
            await session.abortTransaction();
            // 409 Conflict: Request could not be completed due to a conflict with the current state of the resource
            return res.status(409).json({ "message": "Insufficient seats available." }); 
        }

        // 3. Update State (decrement seats)
        trip.available_seats -= seatsToBook;
        await trip.save({ session }); // Save must pass the session

        // 4. (Conceptual Step for Completeness) Create the Booking record here...
        // If you had a separate Booking model, you would create and save it here:
        // const BookingModel = mongoose.model('bookings');
        // const newBooking = new BookingModel({ tripCode, userId, seats: seatsToBook });
        // await newBooking.save({ session });

        // 5. Commit Transaction (All steps complete successfully)
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({ 
            "message": "Booking successful.", 
            "tripCode": tripCode,
            "seatsBooked": seatsToBook,
            "new_available_seats": trip.available_seats 
        });

    } catch (error) {
        // Rollback Transaction on any failure (network error, validation failure, etc.)
        await session.abortTransaction();
        session.endSession();
        console.error("Booking Transaction Failed:", error);

        return res.status(500).json({ "message": "Booking failed due to a server error.", "error": error.message });
    }
};


module.exports = {
    tripsList,
    tripsFindByCode,
    tripsAddTrip,
    tripsUpdateTrip,
    tripsSearch, // NEW: Export the search function
    tripsBookTrip // **NEW: Export the booking function**
};