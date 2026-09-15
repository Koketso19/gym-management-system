var express = require('express');
var Worker = require('../models/workerModel');
var { verifyToken } = require('../middleware/authMiddleware');

var router = express.Router();

// GET all workers
router.get('/', verifyToken, async function (req, res) {
  try {
    var workers = await Worker.find();
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADD a new worker
router.post('/', verifyToken, async function (req, res) {
  try {
    var { name, email, username, password, role } = req.body;
    var newWorker = new Worker({ name, email, username, password, role });
    await newWorker.save();
    res.status(201).json(newWorker);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE worker details
router.put('/:id', verifyToken, async function (req, res) {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    const fields = ['name', 'email', 'username', 'password'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        worker[field] = req.body[field];
      }
    });

    const updated = await worker.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a worker
router.delete('/:id', verifyToken, async function (req, res) {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    await worker.deleteOne();
    res.json({ message: 'Worker deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;


