const router  = require('express').Router();
const auditDB = require('../services/auditDB');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');

// GET /api/audit/stats — SQL audit database stats
router.get('/stats', authMiddleware, adminOnly, (req, res) => {
  res.json(auditDB.getStats());
});

// GET /api/audit/messages — all messages ever sent (immutable)
router.get('/messages', authMiddleware, adminOnly, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const q     = req.query.q;
  const data  = q ? auditDB.searchMessages(q) : auditDB.getRecentMessages(limit);
  res.json(data);
});

// GET /api/audit/posts — all posts ever created (immutable)
router.get('/posts', authMiddleware, adminOnly, (req, res) => {
  res.json(auditDB.getRecentPosts(parseInt(req.query.limit) || 100));
});

// GET /api/audit/deletions — all deletions ever done (immutable)
router.get('/deletions', authMiddleware, adminOnly, (req, res) => {
  res.json(auditDB.getRecentDeletions(parseInt(req.query.limit) || 100));
});

// GET /api/audit/violence — all violence events ever detected (immutable)
router.get('/violence', authMiddleware, adminOnly, (req, res) => {
  res.json(auditDB.getRecentViolence(parseInt(req.query.limit) || 100));
});

// GET /api/audit/users — all user events (login, register, block, follow)
router.get('/users', authMiddleware, adminOnly, (req, res) => {
  res.json(auditDB.getRecentUsers(parseInt(req.query.limit) || 100));
});

module.exports = router;
