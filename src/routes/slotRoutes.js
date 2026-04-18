const express = require('express');
const router = express.Router();
const Slot = require('../models/slot');

router.post('/', async (req, res) => {
    try {
        const slot = await Slot.create(req.body);
        res.json(slot);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;