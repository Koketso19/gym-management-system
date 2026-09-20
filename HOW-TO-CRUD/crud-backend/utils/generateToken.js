const jwt = require('jsonwebtoken');

// Accepts a payload object. Signs it as-is.
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = generateToken;