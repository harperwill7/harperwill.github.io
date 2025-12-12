// (MODIFIED to include available_seats)

const mongoose = require('mongoose');

// Define the trip schema
const tripSchema = new mongoose.Schema({

    code: { type: String, required: true, index: true },
    name: { type: String, required: true, index: true },
    length: { type: String, required: true },
    start: { type: Date, required: true },
    resort: { type: String, required: true },
    perPerson: { type: String, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
    // **NEW FIELD** for transactional seat management
    available_seats: { type: Number, required: true, default: 0 } // <-- ADDED
});

const Trip = mongoose.model('trips', tripSchema);

module.exports = Trip;