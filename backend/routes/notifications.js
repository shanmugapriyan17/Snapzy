const router    = require('express').Router();
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, async (req, res) => {
  const notifs = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 }).limit(50)
    .populate('sender', 'username avatar')
    .populate('post', 'content postHash');
  res.json(notifs);
});

router.put('/read-all', authMiddleware, async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true });
});

router.put('/:id/read', authMiddleware, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true });
});

module.exports = router;
