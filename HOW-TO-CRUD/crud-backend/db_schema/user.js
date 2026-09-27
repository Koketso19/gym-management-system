// ================================================================
// DB SCHEMA: SysUsers (unified — staff + members)
// ================================================================

var mongoose = require('mongoose');
var moment   = require('moment');

var Schema = mongoose.Schema;

var userSchema = new Schema({
  // ---- AUTH (shared by staff + members) ----
  UserID           : { type: String, required: true, index: { unique: true } },
  FirstName        : { type: String, required: true },
  LastName         : { type: String, required: true },
  ConfirmedPassword: { type: Boolean, default: false },
  Password         : { type: String, required: true, bcrypt: true },
  CreateDate       : { type: String, default: () => moment().format('YYYY-MM-DD HH:mm:ss') },
  LastUpdate       : { type: String, default: () => moment().format('YYYY-MM-DD HH:mm:ss') },
  LastUpdateUser   : { type: String, default: null },
  LastLogin        : { type: String, default: null },
  UserGroup        : { type: [String], default: ['Users'] },

  // ---- CONTACT (mostly for members, optional for staff) ----
  email: { type: String, default: null, index: { unique: true, sparse: true } },
  phone: { type: String, default: null, index: { unique: true, sparse: true } },

  // ---- MEMBERSHIP (members only — null for staff) ----
  membership: {
    name     : { type: String, default: null },
    rate     : { type: Number, default: 0 },
    startDate: { type: String, default: null },
    endDate  : { type: String, default: null }
  },

  // ---- PAYMENT SUMMARY (members only) ----
  payment: {
    currentMonth : { type: String, default: null },
    status       : { type: String, enum: ['Paid','Partial','Unpaid', null], default: null },
    paidThisMonth: { type: Number, default: 0 },
    dueThisMonth : { type: Number, default: 0 },
    balance      : { type: Number, default: 0 },
    lastPaidAt   : { type: String, default: null }
  },

  // ---- CHECK-IN STATE (members only) ----
  currentlyInGym      : { type: Boolean, default: false },
  lastCheckIn         : { type: String, default: null },
  lastCheckOut        : { type: String, default: null },
  totalVisitsThisMonth: { type: Number, default: 0 },

  // ---- STATUS (members only) ----
  status: { type: String, enum: ['Active','Inactive','Expired', null], default: null }
}, { collection: 'SysUsers' });

userSchema.plugin(require('mongoose-bcrypt'));

const User = mongoose.model('SysUsers', userSchema);

module.exports = User;