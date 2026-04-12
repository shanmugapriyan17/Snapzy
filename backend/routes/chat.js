const express = require('express');
const router = express.Router();
const mlService = require('../services/mlService');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { message, history, isSidebar } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const response = await mlService.szyChat(message, history || [], isSidebar);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
