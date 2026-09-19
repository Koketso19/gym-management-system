// ================================================================
// DB SCHEMA: Clients
// ================================================================
// PURPOSE: Gym members (separate from SysUsers = admins/staff)
// ================================================================

var mongoose = require('mongoose');
var moment   = require('moment');

var Schema = mongoose.Schema;

var clientSchema = new Schema({
  // ---- AUTH (same shape as SysUsers) ----
  UserID           : {type: String, required: true, index: {unique: true}},
  FirstName        : {type: String, required: true},
  LastName         : {type: String, required: true},
  ConfirmedPassword: {type: Boolean, default: false},
  Password         : {type: String, required: true, bcrypt: true},
  CreateDate       : {type: String, default: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')},
  LastUpdate       : {type: String, default: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')},
  LastUpdateUser   : {type: String, default: null},
  UserGroup        : {type: [String], default: ['Members']},

  // ---- CONTACT ----
  email: {type: String, required: true, index: {unique: true, sparse: true}},
  phone: {type: String, required: true, index: {unique: true, sparse: true}},

  // ---- MEMBERSHIP ----
  membership: {
    name     : {type: String, default: 'Monthly'},
    rate     : {type: Number, default: 500},
    startDate: {type: String, default: null},
    endDate  : {type: String, default: null}
  },

  // ---- PAYMENT (admin marks this) ----
  payment: {
    currentMonth: {type: String, default: moment(new Date()).format('YYYY-MM')},
    status      : {type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid'},
    paidAmount  : {type: Number, default: 0},
    dueAmount   : {type: Number, default: 0},
    paidAt      : {type: String, default: null},
    markedBy    : {type: String, default: null}
  },

  // ---- CHECK-IN STATE (the "book") ----
  currentlyInGym      : {type: Boolean, default: false},
  lastCheckIn         : {type: String, default: null},
  lastCheckOut        : {type: String, default: null},
  totalVisitsThisMonth: {type: Number, default: 0},

  // ---- STATUS ----
  status: {type: String, enum: ['Active', 'Inactive', 'Expired'], default: 'Active'}
}, { collection: 'clients' });

clientSchema.plugin(require('mongoose-bcrypt'));

const Client = mongoose.model('clients', clientSchema);

module.exports = Client;