// ================================================================
// routes/clients/clients.js
// Action-based API — ID comes from req.body
// ================================================================

const express = require('express');
const router  = express.Router();
const moment  = require('moment');

// ---- YOUR JWT MIDDLEWARE ----
const { verifyToken } = require('../../middleware/authMiddleware');

// ---- YOUR CLASS LIBRARIES ----
const ClientLib = require('../../lib/classClient');
const LogLib    = require('../../lib/classLogging');
const ParamLib  = require('../../lib/classParam');

// ---- INITIALIZE ----
const c     = new ClientLib();
const log   = new LogLib();
const param = new ParamLib();

// ================================================================
// POST /api/clients/create
// ================================================================
router.post('/api/clients/create', async function (req, res) {
  console.log('POST /api/clients/create', req.body);

  try {
    const { username, password, firstName, lastName, email, phone, rate } = req.body;

    if (!username || !password || !firstName || !lastName || !email || !phone) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existing = await c.FindOneRec({ UserID: username.toLowerCase() });
    if (existing.Rec) {
      return res.status(400).json({ success: false, message: 'UserID already exists' });
    }

    const ClientData = {
      UserID           : username.toLowerCase(),
      FirstName        : firstName,
      LastName         : lastName,
      Password         : password,
      email            : email.toLowerCase(),
      phone            : phone,
      ConfirmedPassword: true,
      UserGroup        : ['Members'],
      membership: {
        name     : 'Monthly',
        rate     : Number(rate) || 500,
        startDate: moment().format('YYYY-MM-DD'),
        endDate  : moment().add(1, 'month').format('YYYY-MM-DD')
      },
      payment: {
        currentMonth: moment().format('YYYY-MM'),
        status      : 'Unpaid',
        paidAmount  : 0,
        dueAmount   : Number(rate) || 500,
        paidAt      : null,
        markedBy    : null
      }
    };

    const result = await c.New(ClientData);
    if (result.Err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create client',
        error: result.Err.message
      });
    }

    await log.WriteUserTrToDB(
      param, 'CreateClient', req.user.username,
      `Created client ${username}`, req.user.username
    );

    console.log('✅ Client created:', result.SavedDoc.UserID);

    res.json({
      success: true,
      message: 'Client created successfully',
      client: result.SavedDoc
    });

  } catch (err) {
    console.error('Create client error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ================================================================
// GET /api/clients/list
// ================================================================
router.get('/api/clients/list',  async function (req, res) {
  console.log('GET /api/clients/list — user:', req.user?.username);

  try {
    const result = await c.Find({});
    const clients = result.ClientArr || [];

    console.log('✅ Found clients:', clients.length);

    res.json({
      success: true,
      count: clients.length,
      clients: clients
    });

  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ================================================================
// GET /api/clients/today
// ================================================================
router.get('/api/clients/today',  async function (req, res) {
  console.log('GET /api/clients/today');

  try {
    const result = await c.GetTodayCheckIns();
    res.json({
      success: true,
      count: (result.Logs || []).length,
      logs: result.Logs || []
    });
  } catch (err) {
    console.error('Get today error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// GET /api/clients/in-gym
// ================================================================
router.get('/api/clients/in-gym',  async function (req, res) {
  console.log('GET /api/clients/in-gym');

  try {
    const result = await c.GetCurrentlyInGym();
    res.json({
      success: true,
      count: (result.Clients || []).length,
      clients: result.Clients || []
    });
  } catch (err) {
    console.error('Get in-gym error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// POST /api/clients/get   { id }
// ================================================================
router.post('/api/clients/get',  async function (req, res) {
  console.log('POST /api/clients/get', req.body);

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Client ID required' });

    const result = await c.FindOneRec({ _id: id });
    if (!result.Rec) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    res.json({ success: true, client: result.Rec });

  } catch (err) {
    console.error('Get client error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// POST /api/clients/update   { id, firstName, ... }
// ================================================================
router.post('/api/clients/update',  async function (req, res) {
  console.log('POST /api/clients/update', req.body);

  try {
    const { id, firstName, lastName, email, phone, status, rate } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Client ID required' });

    const result = await c.FindOneRec({ _id: id });
    if (!result.Rec) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const Rec = result.Rec;

    if (firstName) Rec.FirstName = firstName;
    if (lastName)  Rec.LastName  = lastName;
    if (email)     Rec.email     = email.toLowerCase();
    if (phone)     Rec.phone     = phone;
    if (status)    Rec.status    = status;
    if (rate)      Rec.membership.rate = Number(rate);

    Rec.LastUpdate     = moment().format('YYYY-MM-DD HH:mm:ss');
    Rec.LastUpdateUser = req.user.username;

    const saved = await c.Update(Rec);
    if (saved.Err) {
      return res.status(500).json({ success: false, message: 'Failed to update', error: saved.Err.message });
    }

    await log.WriteUserTrToDB(
      param, 'UpdateClient', req.user.username,
      `Updated client ${Rec.UserID}`, req.user.username
    );

    res.json({ success: true, message: 'Client updated', client: saved.SavedDoc });

  } catch (err) {
    console.error('Update client error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// POST /api/clients/delete   { id }
// ================================================================
router.post('/api/clients/delete',  async function (req, res) {
  console.log('POST /api/clients/delete', req.body);

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Client ID required' });

    const result = await c.DeleteClient({ _id: id });

    await log.WriteUserTrToDB(
      param, 'DeleteClient', req.user.username,
      `Deleted client ${id}`, req.user.username
    );

    res.json({ success: true, message: 'Client deleted', result: result.DeleteResp });

  } catch (err) {
    console.error('Delete client error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// POST /api/clients/mark-paid   { id, amount? }
// ================================================================
router.post('/api/clients/mark-paid',  async function (req, res) {
  console.log('POST /api/clients/mark-paid', req.body);

  try {
    const { id, amount } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Client ID required' });

    const result = await c.MarkPaid(id, req.user.username, amount);
    if (result.Err) {
      return res.status(400).json({ success: false, error: result.Err });
    }

    await log.WriteUserTrToDB(
      param, 'MarkPaid', req.user.username,
      `Marked client ${id} as PAID`, req.user.username
    );

    res.json({ success: true, message: 'Marked as paid', client: result.SavedDoc });

  } catch (err) {
    console.error('Mark paid error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// POST /api/clients/mark-unpaid   { id }
// ================================================================
router.post('/api/clients/mark-unpaid',  async function (req, res) {
  console.log('POST /api/clients/mark-unpaid', req.body);

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Client ID required' });

    const result = await c.MarkUnpaid(id, req.user.username);
    if (result.Err) {
      return res.status(400).json({ success: false, error: result.Err });
    }

    await log.WriteUserTrToDB(
      param, 'MarkUnpaid', req.user.username,
      `Marked client ${id} as UNPAID`, req.user.username
    );

    res.json({ success: true, message: 'Marked as unpaid', client: result.SavedDoc });

  } catch (err) {
    console.error('Mark unpaid error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// POST /api/clients/checkin   { id }
// ================================================================
router.post('/api/clients/checkin', async function (req, res) {
  console.log('POST /api/clients/checkin', req.body);

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Client ID required' });

    const result = await c.CheckIn(id);
    if (result.Err) {
      return res.status(400).json({ success: false, error: result.Err });
    }

    await log.WriteUserTrToDB(
      param, 'CheckIn', req.user.username,
      `Client ${id} checked in`, req.user.username
    );

    res.json({
      success: true,
      message: 'Checked in',
      client: result.SavedDoc,
      log: result.Log
    });

  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// POST /api/clients/checkout   { id }
// ================================================================
router.post('/api/clients/checkout',  async function (req, res) {
  console.log('POST /api/clients/checkout', req.body);

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Client ID required' });

    const result = await c.CheckOut(id);
    if (result.Err) {
      return res.status(400).json({ success: false, error: result.Err });
    }

    await log.WriteUserTrToDB(
      param, 'CheckOut', req.user.username,
      `Client ${id} checked out`, req.user.username
    );

    res.json({
      success: true,
      message: 'Checked out',
      client: result.SavedDoc,
      log: result.Log,
      durationMinutes: result.durationMinutes
    });

  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// POST /api/clients/history   { id, limit? }
// ================================================================
router.post('/api/clients/history',  async function (req, res) {
  console.log('POST /api/clients/history', req.body);

  try {
    const { id, limit } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Client ID required' });

    const result = await c.GetCheckInHistory(id, Number(limit) || 100);

    res.json({
      success: true,
      count: (result.Logs || []).length,
      logs: result.Logs || []
    });

  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;