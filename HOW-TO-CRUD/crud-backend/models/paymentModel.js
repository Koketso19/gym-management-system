var mongoose = require('mongoose');

var paymentSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  method: String
});

module.exports = mongoose.model('Payment', paymentSchema);
