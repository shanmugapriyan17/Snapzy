const router = require('express').Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');
const ActivityLog = require('../models/ActivityLog');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const blockchain = require('../services/blockchainService');
const mlService = require('../services/mlService');
const crypto = require('crypto');
// POST /api/admin/submit-hash-verification — User submits ANY hash (post/message/comment/account) for admin review
router.post('/submit-hash-verification', authMiddleware, async (req, res) => {
  try {
    const { hash, hashType, context } = req.body; // hashType: 'post' | 'comment' | 'message' | 'account'
    if (!hash) return res.status(400).json({ error: 'Hash is required' });

    await ActivityLog.create({
      action: 'hash_verification_request',
      actor: req.user._id,
      targetType: hashType || 'post',
      target: hash,
      details: `@${req.user.username} submitted hash for admin verification. Context: ${context || 'N/A'} | Hash: ${hash}`,
      severity: 'info',
      contentHash: hash,
    });

    // If account hash, also flag user as pending
    if (hashType === 'account') {
      await User.findByIdAndUpdate(req.user._id, { blockchainStatus: 'pending_admin' });
    }

    res.json({ success: true, message: 'Submitted to admin review queue' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/submit-verification — legacy account-only submit (backward compat)
router.post('/submit-verification', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { blockchainStatus: 'pending_admin' });
    await ActivityLog.create({
      action: 'hash_verification_request', actor: req.user._id, targetType: 'account',
      target: req.user.accountHash, details: `@${req.user.username} submitted account hash for admin verification`,
      severity: 'info', contentHash: req.user.accountHash,
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/pending-verifications — Admin lists ALL pending hash requests
router.get('/pending-verifications', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Get pending account users
    const pendingUsers = await User.find({ blockchainStatus: 'pending_admin' }).select('-password').sort({ createdAt: -1 });
    // Get all hash_verification_request logs
    const hashRequests = await ActivityLog.find({ action: 'hash_verification_request' })
      .sort({ createdAt: -1 }).limit(100)
      .populate('actor', 'username fullName avatar role');

    res.json({ pendingUsers, hashRequests });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/approve-verification/:userId — Admin approves account
router.post('/approve-verification/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { blockchainStatus: 'confirmed', isVerified: true });
    await ActivityLog.create({
      action: 'admin_approved_verification', actor: req.user._id, targetType: 'user',
      target: req.params.userId, details: `Admin @${req.user.username} approved verification`,
      severity: 'info',
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/resolve-hash/:logId — Admin marks a hash review as resolved
router.post('/resolve-hash/:logId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { verdict } = req.body; // 'verified' | 'rejected'
    await ActivityLog.findByIdAndUpdate(req.params.logId, {
      details: `${req.body.originalDetails || ''} | ADMIN VERDICT: ${verdict} by @${req.user.username}`,
      severity: verdict === 'verified' ? 'info' : 'warning',
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// GET /api/admin/dashboard
router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users, flaggedUsers, posts, flaggedPosts, msgs, flaggedMsgs, deletedPosts] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isFlagged: true }),
      Post.countDocuments({ isDeleted: { $ne: true } }),
      Post.countDocuments({ isFlagged: true, isDeleted: { $ne: true } }),
      Message.countDocuments(),
      Message.countDocuments({ isFlagged: true }),
      Post.countDocuments({ isDeleted: true }),
    ]);

    let chainStats = { connected: false };
    try {
      const stats = await blockchain.getStats();
      if (stats) {
        chainStats = {
          connected: true,
          accounts: Number(stats[0]),
          posts: Number(stats[1]),
          messages: Number(stats[2]),
          verifications: Number(stats[3]),
          flagged: Number(stats[4]),
          deletions: Number(stats[5]),
        };
      }
    } catch { }

    res.json({ users, flaggedUsers, posts, flaggedPosts, messages: msgs, flaggedMsgs, deletedPosts, chainStats });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/activity — live activity feed
router.get('/activity', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(limit)
      .populate('actor', 'username fullName avatar role');
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/all-users — searchable user list
router.get('/all-users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    const filter = {};
    if (q) filter.$or = [{ username: { $regex: q, $options: 'i' } }, { fullName: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }];
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 }).limit(200);
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/flagged-users
router.get('/flagged-users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({ isFlagged: true }).select('-password').sort({ fakeScore: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/flagged-posts
router.get('/flagged-posts', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ isFlagged: true, isDeleted: { $ne: true } })
      .sort({ moderationScore: -1 })
      .populate('author', 'username fullName avatar');
    res.json(posts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/flagged-messages
router.get('/flagged-messages', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const msgs = await Message.find({ isFlagged: true })
      .sort({ createdAt: -1 })
      .populate('sender', 'username').populate('receiver', 'username');
    res.json(msgs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/deletion-log — ALL deletions (posts + comments) from immutable SQLite audit
router.get('/deletion-log', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const auditDB = require('../services/auditDB');
    const limit = parseInt(req.query.limit) || 100;
    const deletions = auditDB.getRecentDeletions(limit);
    res.json(deletions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/approve-post/:id — unflag a post
router.post('/approve-post/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, { isFlagged: false, flagReason: '' });
    await ActivityLog.create({ action: 'post_approved', actor: req.user._id, target: req.params.id, targetType: 'post', details: 'Admin approved content' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/unflag-user/:id
router.post('/unflag-user/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isFlagged: false, fakeScore: 0, flagReason: '' });
    await ActivityLog.create({ action: 'admin_action', actor: req.user._id, target: req.params.id, targetType: 'user', details: 'Admin unflagged user' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/suspend-user/:id
router.post('/suspend-user/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.isActive = false;
    user.suspendedAt = new Date();
    user.suspendedBy = req.user._id;
    await user.save();
    await ActivityLog.create({ action: 'user_suspended', actor: req.user._id, target: req.params.id, targetType: 'user', details: `Admin suspended @${user.username}`, severity: 'critical' });
    // Blockchain record
    setImmediate(async () => {
      try { await blockchain.flagAccount(user.accountHash, 'Suspended by admin'); } catch { }
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/unsuspend-user/:id
router.post('/unsuspend-user/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: true, $unset: { suspendedAt: 1, suspendedBy: 1 } });
    await ActivityLog.create({ action: 'user_unsuspended', actor: req.user._id, target: req.params.id, targetType: 'user', details: 'Admin unsuspended user' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/analyze-all — batch ML scan
router.post('/analyze-all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({});
    let analyzed = 0;
    for (const u of users) {
      const mlResult = await mlService.detectFake({ username: u.username, bio: u.bio || '', avatar: u.avatar || '', postsCount: u.postsCount, followersCount: u.followers?.length || 0, followingCount: u.following?.length || 0, accountAge: Math.floor((Date.now() - u.createdAt) / 86400000) });
      const vHash = '0x' + crypto.createHash('sha256').update(`${u.accountHash}${mlResult.isFake}${Date.now()}`).digest('hex');
      await User.findByIdAndUpdate(u._id, { fakeScore: mlResult.score, isFlagged: mlResult.isFake, $push: { verificationHistory: { verificationHash: vHash, result: mlResult.isFake, confidence: mlResult.confidence, model: 'rule-based', reasons: mlResult.reasons } } });
      analyzed++;
    }
    res.json({ analyzed });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/admin/remove-user/:id
router.delete('/remove-user/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    user.isActive = false;
    await user.save();
    await ActivityLog.create({ action: 'user_deleted', actor: req.user._id, target: req.params.id, targetType: 'user', details: `Admin removed @${user.username}`, severity: 'critical' });
    setImmediate(async () => {
      try { await blockchain.flagAccount(user.accountHash, 'Removed by admin'); } catch { }
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/admin/remove-post/:id — admin hide + blockchain
router.delete('/remove-post/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    post.isHidden = true;
    post.isDeleted = true;
    post.deletedAt = new Date();
    post.deletedBy = req.user._id;
    await post.save();
    await ActivityLog.create({ action: 'post_hidden', actor: req.user._id, target: req.params.id, targetType: 'post', details: 'Admin hid post', contentHash: post.postHash, severity: 'warning' });
    setImmediate(async () => {
      try { await blockchain.recordDeletion(post.postHash, req.user.accountHash, 'Admin removed content'); } catch { }
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
