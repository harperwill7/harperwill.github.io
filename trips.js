// app_api/controllers/trips.js (MODIFIED to include search)

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
        description: req.body.description

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
            description: req.body.description

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


module.exports = {
    tripsList,
    tripsFindByCode,
    tripsAddTrip,
    tripsUpdateTrip,
    tripsSearch // NEW: Export the search function
};