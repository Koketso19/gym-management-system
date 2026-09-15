var express = require('express');
var Client = require('../models/clientModel');

var router = express.Router();

router.get('/', async function(req, res) {
  try {
    var clients = await Client.find().populate('property room payments');
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async function(req, res) {
  try {
    var newClient = new Client(req.body);
    var saved = await newClient.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async function(req, res) {
  try {
    var updated = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async function(req, res) {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
