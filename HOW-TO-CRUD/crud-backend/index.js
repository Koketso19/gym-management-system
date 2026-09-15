// ================================================================
// DEPENDENCY INJECTION & CONFIGURATION
// ================================================================

var express = require('express');
var dotenv = require('dotenv');
var cors = require('cors');
var mongoose = require("mongoose");
var fs = require("fs");
var moment = require("moment");
var async = require("async");
var formidable = require("formidable");
var bodyParser = require("body-parser");
var connectDB = require('./config/db.js');

// ================================================================
// LOGGING
// ================================================================

var logging = require("./lib/classLogging");
var log = new logging();
var ProcName = "PropertyManagement";

// ================================================================
// ENV & CONFIG
// ================================================================

dotenv.config();

var conf = require("./config/sysconfig");

var dbUrl = conf.mongoDB ? conf.mongoDB.url : process.env.MONGO_URI;
var port = process.env.PORT || conf.ui_port || 3000;
var clientURL = process.env.CLIENT_URL || "http://localhost:5173";

var app = express();
var FirstConnect = true;

// ================================================================
// STATIC FILES
// ================================================================

app.use(express.static(__dirname + "/public"));

// ================================================================
// BODY PARSERS
// ================================================================

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.text());

// ================================================================
// CORS - Allow React Vite with JWT
// ================================================================

app.use(cors({
  origin: clientURL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ================================================================
// REQUEST LOGGING MIDDLEWARE
// ================================================================

app.use(function(req, res, next) {
  log.WriteToFile(ProcName, `${req.method} ${req.url} - Request from ${req.ip}`);
  if (req.body && Object.keys(req.body).length > 0) {
    log.WriteToFile(ProcName, `Body: ${JSON.stringify(req.body)}`);
  }
  next();
});

// ================================================================
// DB CONNECTION - ✅ UPDATED for Mongoose 7+
// ================================================================

function DbConnect() {
  if (dbUrl) {
    // ✅ REMOVED deprecated options: useNewUrlParser, useUnifiedTopology
    mongoose.connect(dbUrl)
      .then(() => {
        log.WriteToFile(ProcName, "✅ MongoDB: Connection Established.");
        if (FirstConnect) {
          const server = app.listen(port);
          server.keepAliveTimeout = 65000;
          server.headersTimeout = 66000;
          FirstConnect = false;
          log.WriteToFile(ProcName, `🚀 Server running at http://localhost:${port}/`);
          log.WriteToFile(ProcName, `📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        }
      })
      .catch(err => {
        log.WriteToFile(ProcName, `❌ MongoDB: Connection Error: ${err.message}`);
        setTimeout(DbConnect, 10000);
      });
  } else {
    log.WriteToFile(ProcName, "ERROR: No MongoDB URL found!");
  }
}

// ✅ UPDATED: Mongoose 7+ uses promises, not callbacks
function DbDisconnect() {
  mongoose.connection.close()
    .then(() => {
      log.WriteToFile(ProcName, "Cleared DB Link");
      setTimeout(function() {
        log.WriteToFile(ProcName, "Attempting DB Reconnection...");
        DbConnect();
      }, 10000);
    })
    .catch(err => {
      log.WriteToFile(ProcName, `❌ Disconnect error: ${err.message}`);
    });
}

// ================================================================
// DB EVENT HANDLERS - ✅ UPDATED
// ================================================================

mongoose.connection.on("error", function(err) {
  log.WriteToFile(ProcName, `❌ MongoDB: Connection Error: ${err.message}`);
  return DbDisconnect();
});

mongoose.connection.on("disconnected", function() {
  log.WriteToFile(ProcName, "⚠️ Mongoose default connection disconnected");
  return DbDisconnect();
});

// Initial DB Connection
DbConnect();

// ================================================================
// PROPERTY MANAGEMENT ROUTES - JWT ONLY
// ================================================================

var authRoutes = require('./routes/auth');
var clientRoutes = require('./routes/clients');
var propertyRoutes = require('./routes/property.js');
var roomRoutes = require('./routes/room.js');
var paymentRoutes = require('./routes/payments');
var eventRoutes = require('./routes/events');
var workerRoutes = require('./routes/workerRoutes');

app.use( authRoutes);
app.use( clientRoutes);
app.use(propertyRoutes);
app.use( roomRoutes);
app.use( paymentRoutes);
app.use( eventRoutes);
app.use( workerRoutes);

// ================================================================
// HEALTH CHECK
// ================================================================

app.get("/", function(req, res) {
  res.send({
    status: 'OK',
    message: '🚀 Property Management API is running...',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ================================================================
// 404 HANDLER
// ================================================================

app.get("*", function(req, res) {
  log.WriteToFile(ProcName, `404: ${req.url} - Not Found`);
  res.status(404).json({
    error: 'Route not found',
    path: req.url
  });
});

// ================================================================
// GLOBAL ERROR HANDLER
// ================================================================

app.use(function(err, req, res, next) {
  log.WriteToFile(ProcName, `❌ ERROR: ${err.message}`);
  log.WriteToFile(ProcName, `Stack: ${err.stack}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ================================================================
// EXPORT
// ================================================================

module.exports = app;