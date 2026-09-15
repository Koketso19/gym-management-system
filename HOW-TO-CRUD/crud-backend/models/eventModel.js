var mongoose = require('mongoose');

var eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  type: String,
  description: String
});

module.exports = mongoose.model('Event', eventSchema);
