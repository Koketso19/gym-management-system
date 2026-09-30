var mongoose = require('mongoose');
var moment   = require('moment');
var Schema   = mongoose.Schema;

var proofSchema = new Schema({
  clientId : { type: Schema.Types.ObjectId, ref: 'SysUsers', required: true, index: true },
  UserID   : { type: String, required: true, index: true },
  FirstName: String,
  LastName : String,

  month    : { type: String, required: true, index: true },  // 'YYYY-MM'
  amount   : { type: Number, required: true },
  method   : { type: String, enum: ['Cash','EFT','Card','Other'], default: 'EFT' },
  note     : { type: String, default: '' },

  fileName : { type: String, required: true },  // stored name on disk
  fileUrl  : { type: String, required: true },  // URL path
  mimeType : { type: String, required: true },
  sizeBytes: { type: Number, default: 0 },

  status     : { type: String, enum: ['Pending','Approved','Rejected'], default: 'Pending', index: true },
  reviewedBy : { type: String, default: null },
  reviewedAt : { type: String, default: null },
  reviewNote : { type: String, default: '' },

  paidAt: { type: String, default: () => moment().format('YYYY-MM-DD HH:mm:ss') }
}, { collection: 'PaymentProofs' });

proofSchema.index({ clientId: 1, month: -1 });

module.exports = mongoose.model('PaymentProofs', proofSchema);