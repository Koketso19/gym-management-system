const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: String,
  email: String,
  username: String,
  password: String,
  role: { type: String, default: 'user' },
});

module.exports = mongoose.model('Worker', workerSchema); // this maps to 'workers' collection
