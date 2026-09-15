var mongoose = require('mongoose');

var clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: String,
  email: String,
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }]
});

module.exports = mongoose.model('Client', clientSchema);
