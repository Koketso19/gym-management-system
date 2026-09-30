// ================================================================
// routes/paymentProofs.js
// Proof-of-payment uploads and review workflow
// ================================================================

const express  = require('express');
const router   = express.Router();
const path     = require('path');
const fs       = require('fs');
const multer   = require('multer');
const moment   = require('moment');

const { verifyToken, requirePrivilege } = require('../middleware/authMiddleware');
const LogLib   = require('../lib/classLogging');
const ParamLib = require('../lib/classParam');
const PaymentProof = require('../db_schema/paymentProof');
const User         = require('../db_schema/user');
const PaymentService = require('../lib/classPayment');

const log   = new LogLib();
const param = new ParamLib();
const ps    = new PaymentService();

// ---- ensure upload folder exists ----
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'proofs');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---- multer config ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, safe);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },   // 10 MB
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/png','image/webp','image/heic','application/pdf'];
    if (!ok.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, WEBP, HEIC or PDF allowed'));
    }
    cb(null, true);
  }
});

// ================================================================
// POST /api/payments/proof/upload
// multipart/form-data:
//   file    (required)
//   month   (YYYY-MM, default: current)
//   amount  (number, required)
//   method  (Cash|EFT|Card|Other)
//   note    (optional)
// ================================================================
router.post(
  '/api/payments/proof/upload',
  verifyToken,
  upload.single('file'),
  async function (req, res) {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

      const { month, amount, method, note } = req.body;
      if (!amount) {
        // delete the uploaded file if validation fails
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ success: false, message: 'Amount is required' });
      }

      // Look up the uploader in SysUsers
      const who = req.user.username.toLowerCase();
      const found = await User.findOne({ UserID: who });
      if (!found) {
        fs.unlink(req.file.path, () => {});
        return res.status(404).json({ success: false, message: 'User record not found' });
      }

      const proof = await PaymentProof.create({
        clientId : found._id,
        UserID   : found.UserID,
        FirstName: found.FirstName,
        LastName : found.LastName,
        month    : month || moment().format('YYYY-MM'),
        amount   : Number(amount),
        method   : method || 'EFT',
        note     : note || '',
        fileName : req.file.filename,
        fileUrl  : `/uploads/proofs/${req.file.filename}`,
        mimeType : req.file.mimetype,
        sizeBytes: req.file.size,
        status   : 'Pending',
        paidAt   : moment().format('YYYY-MM-DD HH:mm:ss')
      });

      await log.WriteUserTrToDB(
        param, 'UploadProof', req.user.username,
        `Uploaded proof of payment for ${proof.month}`, req.user.username
      );

      res.json({ success: true, message: 'Proof uploaded', proof });
    } catch (err) {
      console.error('proof upload error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ================================================================
// GET /api/payments/proof/mine
// Returns the logged-in user's uploads (any status)
// ================================================================
router.get('/api/payments/proof/mine', verifyToken, async function (req, res) {
  try {
    const who = req.user.username.toLowerCase();
    const list = await PaymentProof.find({ UserID: who }).sort({ paidAt: -1 });
    res.json({ success: true, count: list.length, proofs: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// GET /api/payments/proof/list?month=YYYY-MM&status=Pending
// Admin view — all proofs, filterable
// ================================================================
router.get('/api/payments/proof/list', verifyToken, async function (req, res) {
  try {
    const { month, status } = req.query;
    const filter = {};
    if (month)  filter.month  = month;
    if (status && status !== 'All') filter.status = status;

    const list = await PaymentProof.find(filter).sort({ paidAt: -1 });
    res.json({ success: true, count: list.length, proofs: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// POST /api/payments/proof/approve   { id, reviewNote? }
// - Marks proof as Approved
// - Adds the payment to the member's ledger for that month
// ================================================================
router.post('/api/payments/proof/approve', verifyToken, async function (req, res) {
  try {
    const { id, reviewNote } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'id required' });

    const proof = await PaymentProof.findById(id);
    if (!proof) return res.status(404).json({ success: false, message: 'Proof not found' });
    if (proof.status === 'Approved') {
      return res.status(400).json({ success: false, message: 'Already approved' });
    }

    // Find the client and record a payment in the ledger for that month
    const member = await User.findById(proof.clientId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    // Record via PaymentService, forcing allocation to proof.month
    // We pass amount = proof.amount; the allocator normally distributes oldest-first,
    // but for proof approval we want to credit the specific month.
    await ps.recordPayment(member, Number(proof.amount), {
      method: proof.method || 'EFT',
      paidBy: req.user.username,
      note  : `Approved proof for ${proof.month}`
    });

    // Update proof status
    proof.status      = 'Approved';
    proof.reviewedBy  = req.user.username;
    proof.reviewedAt  = moment().format('YYYY-MM-DD HH:mm:ss');
    proof.reviewNote  = reviewNote || '';
    await proof.save();

    await log.WriteUserTrToDB(
      param, 'ApproveProof', req.user.username,
      `Approved proof ${proof._id} (${proof.UserID}, ${proof.month})`, req.user.username
    );

    res.json({ success: true, message: 'Proof approved', proof });
  } catch (err) {
    console.error('approve proof error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// POST /api/payments/proof/reject   { id, reviewNote? }
// ================================================================
router.post('/api/payments/proof/reject', verifyToken, async function (req, res) {
  try {
    const { id, reviewNote } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'id required' });

    const proof = await PaymentProof.findById(id);
    if (!proof) return res.status(404).json({ success: false, message: 'Proof not found' });

    proof.status     = 'Rejected';
    proof.reviewedBy = req.user.username;
    proof.reviewedAt = moment().format('YYYY-MM-DD HH:mm:ss');
    proof.reviewNote = reviewNote || '';
    await proof.save();

    await log.WriteUserTrToDB(
      param, 'RejectProof', req.user.username,
      `Rejected proof ${proof._id} (${proof.UserID}, ${proof.month})`, req.user.username
    );

    res.json({ success: true, message: 'Proof rejected', proof });
  } catch (err) {
    console.error('reject proof error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;