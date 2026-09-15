// ================================================================
// CLASS LOGGING - Enterprise Logging System
// ================================================================
// Provides: File logging (log4js), Database logging (MongoDB),
// DataTables support, Transaction tracking, User audit trail,
// System logging
// ================================================================

const moment = require("moment");
const TrLog = require("../db_schema/trLogging");
const UserTrLog = require("../db_schema/userTrLogging");
const commonFuntions = require("./commonFunctions");
const logjs = require("log4js");
const logConfig = require("../config/log4js.json");

// Configure log4js for file logging
logjs.configure(logConfig);

// Create default logger instance
var logger = logjs.getLogger();
logger.level = "debug";

// ================================================================
// HELPER: Get Description from Functions array
// ================================================================
// Looks up function name in SystemFunctionSettings and returns Description
function _GetDescFromFunctions(FuncName, Functions) {
  let x = 0;
  while (x < Functions.length) {
    if (Functions[x].name == FuncName) {
      return Functions[x].Description;
    }
    x++;
  }
  return null;
}

// ================================================================
// DATA TABLES: Get User Transaction Data
// ================================================================
// Fetches user transaction logs with DataTables pagination,
// sorting, and search filtering
// Returns: JSON string for DataTables
// ================================================================
async function _DtGetUserTrData(req, loggedInUser) {
  let searchStr = {};

  let strSearch = req.body["search[value]"];
  let strSort = req.body["order[0][column]"];
  let SortIndex = "columns[" + strSort + "][data]";
  let SortValue = req.body[SortIndex];
  let strSortDir = req.body["order[0][dir]"];
  let SortDir = -1;

  if (strSortDir == "asc") {
    SortDir = 1;
  }

  let strSysSort = '{"' + SortValue + '":' + SortDir + "}";
  let SysSort = JSON.parse(strSysSort);

  if (strSearch) {
    let regex = new RegExp(commonFuntions.escapeRegExp(strSearch), "i");
    searchStr = {
      $or: [
        { TransactionID: regex },
        { CreateDate: regex },
        { UserID: regex },
        { PluginID: regex },
        { Log: regex },
      ],
    };
  }

  try {
    const recordsTotal = await UserTrLog.countDocuments({});
    const recordsFiltered = await UserTrLog.countDocuments(searchStr);
    const results = await UserTrLog.find(
      searchStr,
      "TransactionID CreateDate UserID PluginID Log",
      {
        skip: Number(req.body.start),
        limit: Number(req.body.length),
        sort: SysSort,
      }
    );

    return JSON.stringify({
      draw: req.body.draw,
      recordsFiltered: recordsFiltered,
      recordsTotal: recordsTotal,
      data: results,
    });
  } catch (err) {
    console.log("error while getting results" + err);
    return null;
  }
}

// ================================================================
// DATA TABLES: Get User Transaction Data with Custom Search
// ================================================================
// Same as above but accepts a custom searchStr for complex filtering
// ================================================================
async function _DtGetSearchUserTrData(req, loggedInUser, searchStr) {
  let strSearch = req.body["search[value]"];
  let strSort = req.body["order[0][column]"];
  let SortIndex = "columns[" + strSort + "][data]";
  let SortValue = req.body[SortIndex];
  let strSortDir = req.body["order[0][dir]"];
  let SortDir = -1;

  if (strSortDir == "asc") {
    SortDir = 1;
  }

  let strSysSort = '{"' + SortValue + '":' + SortDir + "}";
  let SysSort = JSON.parse(strSysSort);

  try {
    const recordsTotal = await UserTrLog.countDocuments({});
    const recordsFiltered = await UserTrLog.countDocuments(searchStr);
    const results = await UserTrLog.find(
      searchStr,
      "TransactionID CreateDate UserID PluginID Log",
      {
        skip: Number(req.body.start),
        limit: Number(req.body.length),
        sort: SysSort,
      }
    );

    return JSON.stringify({
      draw: req.body.draw,
      recordsFiltered: recordsFiltered,
      recordsTotal: recordsTotal,
      data: results,
    });
  } catch (err) {
    console.log("error while getting results" + err);
    return null;
  }
}

// ================================================================
// DATA TABLES: Get Integration Transaction Data with Search
// ================================================================
// Fetches integration/API transaction logs with search
// Used for tracking API calls, integrations, and webhooks
// ================================================================
async function _DtGetSearchedIntegrationTrData(req, loggedInUser, searchStr) {
  let strSearch = req.body["search[value]"];
  let strSort = req.body["order[0][column]"];
  let SortIndex = "columns[" + strSort + "][data]";
  let SortValue = req.body[SortIndex];
  let strSortDir = req.body["order[0][dir]"];
  let SortDir = -1;

  if (strSortDir == "asc") {
    SortDir = 1;
  }

  let strSysSort = '{"' + SortValue + '":' + SortDir + "}";
  let SysSort = JSON.parse(strSysSort);

  if (strSearch) {
    let regex = new RegExp(commonFuntions.escapeRegExp(strSearch), "i");
    searchStr = {
      $or: [
        { TransactionID: regex },
        { CreateDate: regex },
        { Direction: regex },
        { Status: regex },
        { PluginID: regex },
      ],
    };
  }

  let globalFilters = [];
  globalFilters.push(
    ...Object.keys(searchStr).map((key) => ({ [key]: searchStr[key] })),
  );
  searchStr = { $or: globalFilters };

  try {
    const recordsTotal = await TrLog.countDocuments({});
    const recordsFiltered = await TrLog.countDocuments(searchStr);
    const results = await TrLog.find(
      searchStr,
      "TransactionID CreateDate Request Response Direction Status PluginID",
      {
        skip: Number(req.body.start),
        limit: Number(req.body.length),
        sort: SysSort,
      }
    );

    return JSON.stringify({
      draw: req.body.draw,
      recordsFiltered: recordsFiltered,
      recordsTotal: recordsTotal,
      data: results,
    });
  } catch (err) {
    console.log("error while getting results" + err);
    return null;
  }
}

// ================================================================
// DATA TABLES: Get Integration Transaction Data
// ================================================================
// Fetches all integration/API transaction logs with pagination,
// sorting, and search
// ================================================================
async function _DtGetIntegrationTrData(req, loggedInUser) {
  let searchStr = {};

  let strSearch = req.body["search[value]"];
  let strSort = req.body["order[0][column]"];
  let SortIndex = "columns[" + strSort + "][data]";
  let SortValue = req.body[SortIndex];
  let strSortDir = req.body["order[0][dir]"];
  let SortDir = -1;

  if (strSortDir == "asc") {
    SortDir = 1;
  }

  let strSysSort = '{"' + SortValue + '":' + SortDir + "}";
  let SysSort = JSON.parse(strSysSort);

  if (strSearch) {
    let regex = new RegExp(commonFuntions.escapeRegExp(strSearch), "i");
    searchStr = {
      $or: [
        { TransactionID: regex },
        { CreateDate: regex },
        { Request: regex },
        { Response: regex },
        { Direction: regex },
        { Status: regex },
        { PluginID: regex },
      ],
    };
  }

  try {
    const recordsTotal = await TrLog.countDocuments({});
    const recordsFiltered = await TrLog.countDocuments(searchStr);
    const results = await TrLog.find(
      searchStr,
      "TransactionID CreateDate Request Response Direction Status PluginID",
      {
        skip: Number(req.body.start),
        limit: Number(req.body.length),
        sort: SysSort,
      }
    );

    return JSON.stringify({
      draw: req.body.draw,
      recordsFiltered: recordsFiltered,
      recordsTotal: recordsTotal,
      data: results,
    });
  } catch (err) {
    console.log("error while getting results" + err);
    return null;
  }
}

// ================================================================
// MAIN EXPORT CLASS: WriteToLog
// ================================================================
// Usage:
//   const logging = require("./lib/classLogging");
//   const log = new logging("ServiceName");
//   await log.info("This is an info message");
// ================================================================
module.exports = class WriteToLog {
  // ==============================================================
  // CONSTRUCTOR
  // ==============================================================
  // Initialize logger with a specific name (e.g., "UI", "API")
  // ==============================================================
  constructor(logname = "") {
    logger = logjs.getLogger(logname ?? null);
    logger.level = "debug";
  }

  // ==============================================================
  // LOG LEVEL METHODS
  // ==============================================================

  // Log informational message
  async info(message) {
    logger.info(message);
    return Promise.resolve();
  }

  // Log error message
  async error(message) {
    logger.error(message);
    return Promise.resolve();
  }

  // Log debug message (verbose)
  async debug(message) {
    logger.debug(message);
    return Promise.resolve();
  }

  // Log warning message
  async warn(message) {
    logger.warn(message);
    return Promise.resolve();
  }

  // ==============================================================
  // FILE LOGGING
  // ==============================================================

  // Write to file with timestamp - simple file logging
  async WriteToFile(Process, Msg) {
    if (Msg) {
      console.log(
        moment(new Date()).format("YYYY-MM-DD HH:mm:ss.SSS") +
          " |" +
          Process +
          "| " +
          Msg,
      );
    }
    return Promise.resolve();
  }

  // ==============================================================
  // DATABASE TRANSACTION LOGGING
  // ==============================================================

  // Write API/Integration transaction to database
  // Logs all API calls, webhooks, and integrations
  async WriteTransactionToDB(Key, In, Out, Direction, Status, PluginID) {
    try {
      let Tr = new TrLog({
        TransactionID: Key,
        Request: In,
        Response: Out,
        Direction: Direction,
        Status: Status,
        PluginID: PluginID,
        CreateDate: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      });

      const saveDoc = await Tr.save();
      return saveDoc;
    } catch (err) {
      console.log("Error saving transaction log:", err);
      return null;
    }
  }

  // ==============================================================
  // USER ACTIVITY LOGGING (Audit Trail)
  // ==============================================================

  // Write user activity to database - tracks what users do
  async WriteUserTrToDB(param, FuncName, Key, Msg, user) {
    try {
      const Resp = await param.FindOne({ ParameterName: "SystemFunctionSettings" });

      if (Resp.Err) {
        console.log("Failed to query parameters collections. Err: " + Resp.Err);
        return;
      }

      if (!Resp.Param) {
        console.log("Failed to find Functions in parameters " + FuncName);
        return;
      }

      let Param = Resp.Param;
      let Functions = Param.Fields.Functions;
      let FuncDesc = _GetDescFromFunctions(FuncName, Functions);

      if (!FuncDesc) {
        FuncDesc = FuncName;
      }

      let UserTr = new UserTrLog({
        TransactionID: Key,
        Log: Msg,
        PluginID: FuncDesc,
        UserID: user,
        CreateDate: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      });

      await UserTr.save();
    } catch (err) {
      console.log("Error saving user transaction:", err);
    }
  }

  // ==============================================================
  // SYSTEM ACTIVITY LOGGING
  // ==============================================================

  // Write system activity to database (no user)
  // Logs system events like scheduled tasks and background jobs
  // UserID is set to "SYSTEM"
  async WriteSystemTrToDB(FuncName, Key, Msg) {
    try {
      let UserTr = new UserTrLog({
        TransactionID: Key,
        Log: Msg,
        PluginID: FuncName,
        UserID: "SYSTEM",
        CreateDate: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      });

      await UserTr.save();
    } catch (err) {
      console.log("Error saving system transaction:", err);
    }
  }

  // ==============================================================
  // STREAM METHODS (For large data processing)
  // ==============================================================

  // Get cursor stream for integration logs - process large datasets
  FindStream(KeyValuePair) {
    let Cursor = TrLog.find(KeyValuePair).cursor();
    return Cursor;
  }

  // Get sorted cursor stream for integration logs
  FindStreamSort(KeyValuePair, Sort) {
    let Cursor = TrLog.find(KeyValuePair).sort(Sort).cursor();
    return Cursor;
  }

  // Get cursor stream for user logs
  UrFindStream(KeyValuePair) {
    let Cursor = UserTrLog.find(KeyValuePair).cursor();
    return Cursor;
  }

  // Get sorted cursor stream for user logs
  UrFindStreamSort(KeyValuePair, Sort) {
    let Cursor = UserTrLog.find(KeyValuePair).sort(Sort).cursor();
    return Cursor;
  }

  // ==============================================================
  // FIND METHODS (Query logs)
  // ==============================================================

  // Find integration logs
  async Find(KeyValuePair) {
    try {
      const TrArr = await TrLog.find(KeyValuePair);
      if (TrArr.length > 0) {
        return { TrArr: TrArr };
      } else {
        return { TrArr: null };
      }
    } catch (err) {
      return { Err: err };
    }
  }

  // Find sorted integration logs
  async FindSort(KeyValuePair, Sort) {
    try {
      const TrArr = await TrLog.find(KeyValuePair).sort(Sort).exec();
      if (TrArr.length > 0) {
        return { TrArr: TrArr };
      } else {
        return { TrArr: null };
      }
    } catch (err) {
      return { Err: err };
    }
  }

  // Find user logs
  async UrTrFind(KeyValuePair) {
    try {
      const TrArr = await UserTrLog.find(KeyValuePair);
      if (TrArr.length > 0) {
        return { TrArr: TrArr };
      } else {
        return { TrArr: null };
      }
    } catch (err) {
      return { Err: err };
    }
  }

  // Find sorted user logs
  async UrTrFindSort(KeyValuePair, Sort) {
    try {
      const TrArr = await UserTrLog.find(KeyValuePair).sort(Sort).exec();
      if (TrArr.length > 0) {
        return { TrArr: TrArr };
      } else {
        return { TrArr: null };
      }
    } catch (err) {
      return { Err: err };
    }
  }

  // Find single integration log
  async FindOne(KeyValuePair) {
    try {
      const Tr = await TrLog.findOne(KeyValuePair);
      if (Tr) {
        return { Tr: Tr };
      } else {
        return { Tr: null };
      }
    } catch (err) {
      return { Err: err };
    }
  }

  // ==============================================================
  // DATA TABLES WRAPPER METHODS
  // ==============================================================

  // Get user log data for DataTables
  async DtGetUserTrData(req, loggedInUser) {
    return await _DtGetUserTrData(req, loggedInUser);
  }

  // Get user log data with custom search for DataTables
  async DtGetSearchUserTrData(req, loggedInUser, searchStr) {
    return await _DtGetSearchUserTrData(req, loggedInUser, searchStr);
  }

  // Get integration log data for DataTables
  async DtGetIntegrationTrData(req, loggedInUser) {
    return await _DtGetIntegrationTrData(req, loggedInUser);
  }

  // Get integration log data with custom search for DataTables
  async DtGetSearchedIntegrationTrData(req, loggedInUser, searchStr) {
    return await _DtGetSearchedIntegrationTrData(req, loggedInUser, searchStr);
  }
};