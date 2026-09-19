// ================================================================
// DB SCHEMA: CheckIns
// ================================================================
// PURPOSE: Every gym visit — replaces the paper sign-in book
// ================================================================

var mongoose = require('mongoose');
var moment   = require('moment');

var Schema = mongoose.Schema;

var checkInSchema = new Schema({
  clientId   : {type: Schema.Types.ObjectId, ref: 'Clients', required: true, index: true},
  UserID     : {type: String, required: true},
  FirstName  : {type: String, required: true},
  LastName   : {type: String, required: true},

  date       : {type: String, required: true, index: true},   // YYYY-MM-DD
  month      : {type: String, required: true, index: true},   // YYYY-MM

  checkInTime : {type: String, required: true},               // YYYY-MM-DD HH:mm:ss
  checkOutTime: {type: String, default: null},
  durationMinutes: {type: Number, default: 0}
}, { collection: 'CheckIns' });

const CheckIn = mongoose.model('CheckIns', checkInSchema);

module.exports = CheckIn;