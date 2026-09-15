// ================================================================
// db_schema/room.js - Room Schema (Simple)
// ================================================================

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  propertyId: { type: String, required: true },
  number: String,
  type: String,
  rent: Number,
  occupied: { type: Boolean, default: false },
  clientId: String,
  features: [String],
});

module.exports = mongoose.model('Room', roomSchema, 'rooms');