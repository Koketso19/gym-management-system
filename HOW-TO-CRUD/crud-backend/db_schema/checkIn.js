// ================================================================
// DB SCHEMA: CheckIns
// ================================================================

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var checkInSchema = new Schema({
  clientId : { type: Schema.Types.ObjectId, ref: 'SysUsers', required: true, index: true },
  UserID   : { type: String, required: true, index: true },
  FirstName: { type: String, required: true },
  LastName : { type: String, required: true },

  date  : { type: String, required: true, index: true },   // YYYY-MM-DD
  month : { type: String, required: true, index: true },   // YYYY-MM

  checkInTime    : { type: String, required: true },
  checkOutTime   : { type: String, default: null },
  durationMinutes: { type: Number, default: 0 }
}, { collection: 'CheckIns' });

checkInSchema.index({ clientId: 1, date: -1 });
checkInSchema.index({ clientId: 1, checkInTime: -1 });

module.exports = mongoose.model('CheckIns', checkInSchema);