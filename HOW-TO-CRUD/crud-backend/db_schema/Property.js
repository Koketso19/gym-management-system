// ================================================================
// db_schema/property.js - Property Schema (Simple)
// ================================================================

const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  _id: String,
  name: String,
  location: String,
  type: String,
  description: String,
  phone: String,
  email: String,
  amenities: [String],
  images: [String],
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Property', propertySchema, 'properties');