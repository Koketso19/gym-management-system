var express = require('express');
var Payment = require('../models/paymentModel');

var router = express.Router();

router.get('/', async function(req, res) {
  try {
    var payments = await Payment.find();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async function(req, res) {
  try {
    var newPayment = new Payment(req.body);
    var saved = await newPayment.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async function(req, res) {
  try {
    var updated = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async function(req, res) {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
