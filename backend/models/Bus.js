const mongoose = require('mongoose');

const BusSchema = new mongoose.Schema({
    busNo: { type: String, required: true, unique: true },
    route: { type: String, default: '' },
    type: { type: String, default: 'Transport' },
    status: { type: String, default: 'Running' },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    capacity: { type: Number, default: 40 },
    filledSeats: { type: Number, default: 0 },
    feesPerTerm: { type: Number, default: 0 },
    insuranceNo: { type: String, default: '' },
    insuranceExpiry: { type: Date },
    condition: { type: String, default: 'Good' },
    maintenanceStatus: { type: String, default: 'Up to date' }
});

module.exports = mongoose.model('Bus', BusSchema);
