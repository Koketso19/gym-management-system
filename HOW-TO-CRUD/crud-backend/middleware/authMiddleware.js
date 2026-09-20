const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;   // ← contains role, privileges, username, gymId, etc.
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid token' });
  }
}

// ---- Require a specific privilege ----
function requirePrivilege(privName) {
  return function (req, res, next) {
    const privs = (req.user && req.user.privileges) || [];
    if (!privs.includes(privName)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — missing privilege: ' + privName
      });
    }
    next();
  };
}

// ---- Require a specific role ----
function requireRole(role) {
  return function (req, res, next) {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — requires role: ' + role
      });
    }
    next();
  };
}

module.exports = { verifyToken, requirePrivilege, requireRole };