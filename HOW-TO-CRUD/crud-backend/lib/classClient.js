// ================================================================
// CLASS CLIENT — gym member operations on SysUsers
// ================================================================

const client   = require('../db_schema/user');   // ✅ unified
const checkIn  = require('../db_schema/checkIn');
const moment   = require('moment');
const formidable = require('formidable');
const PaymentService = require('./classPayment');
const ps = new PaymentService();

// ---- helpers ----
function isString(x) { return Object.prototype.toString.call(x) === '[object String]'; }
function escapeRegExp(str) {
  if (!isString(str)) return '';
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}
function _ToCamelCase(str) {
  return str.toLowerCase().replace(/(?:(^.)|(\s+.))/g, function (match) {
    return match.charAt(match.length - 1).toUpperCase();
  });
}

// ================================================================
// DATA TABLES
// ================================================================
async function _DtGetClientData(req) {
  let searchStr = {};

  let strSearch  = req.body['search[value]'];
  let strSort    = req.body['order[0][column]'];
  let SortIndex  = 'columns[' + strSort + '][data]';
  let SortValue  = req.body[SortIndex] || 'CreateDate';
  let strSortDir = req.body['order[0][dir]'];
  let SortDir    = strSortDir === 'asc' ? 1 : -1;
  let SysSort    = JSON.parse('{"' + SortValue + '":' + SortDir + '}');

  if (strSearch) {
    let regex = new RegExp(escapeRegExp(strSearch), 'i');
    searchStr = {
      $or: [
        { UserID    : regex },
        { FirstName : regex },
        { LastName  : regex },
        { email     : regex },
        { phone     : regex }
      ]
    };
  }

  const extraFilter = req.body.filter;
  if (extraFilter === 'Paid')        searchStr['payment.status']  = 'Paid';
  else if (extraFilter === 'Unpaid') searchStr['payment.status']  = 'Unpaid';
  else if (extraFilter === 'InGym')  searchStr['currentlyInGym']  = true;

  // ✅ members only
  searchStr.UserGroup = 'Members';

  try {
    const recordsTotal    = await client.countDocuments({ UserGroup: 'Members' });
    const recordsFiltered = await client.countDocuments(searchStr);

    const results = await client.find(
      searchStr,
      'UserID FirstName LastName email phone membership payment currentlyInGym lastCheckIn lastCheckOut totalVisitsThisMonth status CreateDate',
      { skip: Number(req.body.start), limit: Number(req.body.length), sort: SysSort }
    );

    const MyData = results.map((r) => ({
      _id                 : r._id,
      UserID              : r.UserID,
      FirstName           : r.FirstName,
      LastName            : r.LastName,
      email               : r.email,
      phone               : r.phone,
      membership          : r.membership,
      paymentStatus       : r.payment?.status || 'Unpaid',
      paidThisMonth       : r.payment?.paidThisMonth || 0,
      dueThisMonth        : r.payment?.dueThisMonth || 0,
      balance             : r.payment?.balance || 0,
      currentlyInGym      : r.currentlyInGym,
      lastCheckIn         : r.lastCheckIn,
      lastCheckOut        : r.lastCheckOut,
      totalVisitsThisMonth: r.totalVisitsThisMonth,
      status              : r.status,
      CreateDate          : r.CreateDate
    }));

    return JSON.stringify({
      draw           : req.body.draw,
      recordsFiltered: recordsFiltered,
      recordsTotal   : recordsTotal,
      data           : MyData
    });
  } catch (err) {
    console.log('Error getting client data:', err);
    return null;
  }
}

// ================================================================
// CREATE
// ================================================================
async function _CreateClient(Object) {
  try {
    const SavedDoc = await client.create(Object);
    return SavedDoc ? { SavedDoc } : { SavedDoc: null };
  } catch (err) {
    return { Err: err };
  }
}

// ================================================================
// MAIN CLASS
// ================================================================
module.exports = class Client {
  constructor() {}

  async DtGetClientData(req) {
    return await _DtGetClientData(req);
  }

  async New(Object) {
    return await _CreateClient(Object);
  }

  async FormNewClientObj(req) {
    return new Promise((resolve, reject) => {
      const form = new formidable.IncomingForm();
      form.parse(req, function (err, fields) {
        if (err) return reject({ Err: err });
        if (fields.uid && fields.firstName && fields.LastName && fields.psw && fields.email && fields.phone) {
          resolve({
            ClientData: {
              UserID           : fields.uid.toLowerCase(),
              FirstName        : _ToCamelCase(fields.firstName),
              LastName         : _ToCamelCase(fields.LastName),
              Password         : fields.psw,
              email            : fields.email.toLowerCase(),
              phone            : fields.phone,
              ConfirmedPassword: true,
              UserGroup        : ['Members'],
              membership: {
                name     : fields.membershipName || 'Monthly',
                rate     : Number(fields.rate) || 500,
                startDate: fields.startDate || moment().format('YYYY-MM-DD'),
                endDate  : fields.endDate   || null
              },
              payment: {
                currentMonth : moment().format('YYYY-MM'),
                status       : 'Unpaid',
                paidThisMonth: 0,
                dueThisMonth : Number(fields.rate) || 500,
                balance      : 0,
                lastPaidAt   : null
              },
              status: 'Active'
            }
          });
        } else {
          resolve({ ClientData: null });
        }
      });
    });
  }

  // ---------- READ / FIND ----------
  async Find(KeyValuePair) {
    try {
      const filter = { ...(KeyValuePair || {}), UserGroup: 'Members' };
      const ClientArr = await client.find(filter);
      return ClientArr.length > 0 ? { ClientArr } : { ClientArr: null };
    } catch (err) {
      return { Err: err };
    }
  }

  async FindOne(UserName, Password, VerifyPwd) {
    try {
      const Rec = await client.findOne({ UserID: UserName });
      if (!Rec) return { Client: null };
      if (VerifyPwd === true) {
        const valid = await Rec.verifyPassword(Password);
        return valid ? { Client: Rec } : { Client: null };
      }
      return { Client: Rec };
    } catch (err) {
      return { Err: err };
    }
  }

  async FindOneRec(KeyValuePair) {
    try {
      const Rec = await client.findOne(KeyValuePair);
      return Rec ? { Rec } : { Rec: null };
    } catch (err) {
      return { Err: err };
    }
  }

  // ---------- UPDATE ----------
  async Update(UpdateObject) {
    if (!UpdateObject) return { SavedDoc: null };
    try {
      const savedDoc = await UpdateObject.save();
      return { SavedDoc: savedDoc };
    } catch (err) {
      return { SavedDoc: null, Err: err };
    }
  }

  async UpdateClient(UpdateObject) {
    return await this.Update(UpdateObject);
  }

  // ---------- DELETE ----------
  async DeleteClient(KeyValuePair) {
    try {
      const Resp = await client.deleteOne(KeyValuePair);
      return { DeleteResp: Resp };
    } catch (err) {
      return { Err: err };
    }
  }

  // ---------- PAYMENT ----------
  async MarkPaid(clientId, markedBy, amount) {
    try {
      const Rec = await client.findById(clientId);
      if (!Rec) return { Err: 'Client not found' };
      if (!(Rec.UserGroup || []).includes('Members')) return { Err: 'Not a member' };
      const out = await ps.recordPayment(Rec, Number(amount) || Rec.membership.rate, {
        method: 'Cash', paidBy: markedBy, note: ''
      });
      return { SavedDoc: out.client, Payment: out.payment };
    } catch (err) {
      return { Err: err };
    }
  }

  async MarkUnpaid(clientId, markedBy) {
    try {
      const Rec = await client.findById(clientId);
      if (!Rec) return { Err: 'Client not found' };
      if (!(Rec.UserGroup || []).includes('Members')) return { Err: 'Not a member' };
      const updated = await ps.clearMonth(Rec, Rec.payment.currentMonth);
      return { SavedDoc: updated };
    } catch (err) {
      return { Err: err };
    }
  }

  async RefundPayment(clientId, paymentId, markedBy, reason) {
    try {
      const Rec = await client.findById(clientId);
      if (!Rec) return { Err: 'Client not found' };
      const out = await ps.refundPayment(Rec, paymentId, markedBy, reason);
      if (out.Err) return { Err: out.Err };
      return { SavedDoc: out.client, Refund: out.refund };
    } catch (err) {
      return { Err: err };
    }
  }

  // ---------- CHECK-IN / CHECK-OUT ----------
  async CheckIn(clientId) {
    try {
      const Rec = await client.findById(clientId);
      if (!Rec) return { Err: 'Client not found' };
      if (!(Rec.UserGroup || []).includes('Members')) return { Err: 'Not a member' };
      if (Rec.currentlyInGym) return { Err: 'Already checked in' };
      if (Rec.payment?.status === 'Unpaid') return { Err: 'Payment required' };

      const now   = moment();
      const date  = now.format('YYYY-MM-DD');
      const month = now.format('YYYY-MM');
      const time  = now.format('YYYY-MM-DD HH:mm:ss');

      const Log = await checkIn.create({
        clientId: Rec._id, UserID: Rec.UserID, FirstName: Rec.FirstName, LastName: Rec.LastName,
        date, month, checkInTime: time, checkOutTime: null, durationMinutes: 0
      });

      Rec.currentlyInGym = true;
      Rec.lastCheckIn    = time;
      if (Rec.payment?.currentMonth && Rec.payment.currentMonth !== month) {
        Rec.totalVisitsThisMonth = 0;
      }
      Rec.totalVisitsThisMonth = (Rec.totalVisitsThisMonth || 0) + 1;
      Rec.LastUpdate           = time;

      await Rec.save();
      return { SavedDoc: Rec, Log };
    } catch (err) {
      return { Err: err };
    }
  }

  async CheckOut(clientId) {
    try {
      const Rec = await client.findById(clientId);
      if (!Rec) return { Err: 'Client not found' };
      if (!Rec.currentlyInGym) return { Err: 'Not currently in gym' };

      const now  = moment();
      const time = now.format('YYYY-MM-DD HH:mm:ss');

      const openLog = await checkIn.findOne({
        clientId: Rec._id, checkOutTime: null
      }).sort({ checkInTime: -1 });

      let durationMinutes = 0;
      if (openLog) {
        const start = moment(openLog.checkInTime, 'YYYY-MM-DD HH:mm:ss');
        durationMinutes = now.diff(start, 'minutes');
        openLog.checkOutTime    = time;
        openLog.durationMinutes = durationMinutes;
        await openLog.save();
      }

      Rec.currentlyInGym = false;
      Rec.lastCheckOut   = time;
      Rec.LastUpdate     = time;
      await Rec.save();

      return { SavedDoc: Rec, Log: openLog, durationMinutes };
    } catch (err) {
      return { Err: err };
    }
  }

  async GetCheckInHistory(clientId, limit) {
    try {
      const logs = await checkIn.find({ clientId }).sort({ checkInTime: -1 }).limit(limit || 100);
      return { Logs: logs };
    } catch (err) {
      return { Err: err };
    }
  }

  async GetTodayCheckIns() {
    try {
      const today = moment().format('YYYY-MM-DD');
      const logs  = await checkIn.find({ date: today }).sort({ checkInTime: -1 });
      return { Logs: logs };
    } catch (err) {
      return { Err: err };
    }
  }

  async GetCurrentlyInGym() {
    try {
      const list = await client.find({
        currentlyInGym: true,
        UserGroup: 'Members'
      }).select('UserID FirstName LastName phone lastCheckIn');
      return { Clients: list };
    } catch (err) {
      return { Err: err };
    }
  }
};