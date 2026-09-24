var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var allocationSchema = new Schema({
  month : { type: String, required: true },
  amount: { type: Number, required: true }
}, { _id: false });

var paymentSchema = new Schema({
  clientId : { type: Schema.Types.ObjectId, ref: 'Clients', required: true, index: true },
  UserID   : { type: String, required: true, index: true },
  FirstName: String,
  LastName : String,

  amount : { type: Number, required: true },
  method : { type: String, enum: ['Cash', 'EFT', 'Card'], default: 'Cash' },
  paidAt : { type: String, required: true },
  paidBy : { type: String, required: true },
  note   : { type: String, default: '' },

  allocations  : [allocationSchema],
  year         : { type: String, index: true },
  balanceAfter : { type: Number, default: 0 }
}, { collection: 'Payments' });

paymentSchema.index({ clientId: 1, paidAt: -1 });

module.exports = mongoose.model('Payments', paymentSchema);