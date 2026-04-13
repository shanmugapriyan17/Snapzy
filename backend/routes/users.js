const router = require('express').Router();
const crypto = require('crypto');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');
const blockchain = require('../services/blockchainService');
const mlService = require('../services/mlService');
const socketSvc = require('../services/socketService');

// GET /api/users/search
router.get('/search', authMiddleware, async (req, res) => {
  const { q } = req.query;
  const users = await User.find({ username: { $regex: q, $options: 'i' }, isActive: true })
    .select('username fullName avatar isFlagged blockchainStatus accountHash').limit(20);
  res.json(users);
});

// GET /api/users/suggestions
router.get('/suggestions', authMiddleware, async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id }, isFlagged: false, isActive: true })
    .select('username fullName avatar fakeScore').limit(5);
  res.json(users);
});

// GET /api/users/suggested
router.get('/suggested', authMiddleware, async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id }, isFlagged: false, isActive: true })
    .select('username fullName avatar fakeScore').limit(5);
  res.json(users);
});

// GET /api/users/online
router.get('/online', authMiddleware, async (req, res) => {
  const users = await User.find({ isOnline: true, isActive: true })
    .select('username fullName avatar').limit(20);
  res.json(users);
});

// GET /api/users/:usernameOrId  — accepts both username and MongoDB ObjectId
router.get('/:usernameOrId', authMiddleware, async (req, res) => {
  const { usernameOrId } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(usernameOrId);
  const query = isObjectId ? User.findById(usernameOrId) : User.findOne({ username: usernameOrId });
  const user = await query
    .select('-password')
    .populate('followers', 'username avatar fullName')
    .populate('following', 'username avatar fullName');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// GET /api/users/:username/posts
router.get('/:username/posts', authMiddleware, async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.status(404).json({ error: 'Not found' });
  const Post = require('../models/Post');
  const posts = await Post.find({ author: user._id, isHidden: false, isDeleted: { $ne: true } })
    .sort({ createdAt: -1 })
    .populate('author', 'username fullName avatar accountHash isFlagged');
  res.json(posts);
});

// POST /api/users/:id/follow
router.post('/:id/follow', authMiddleware, async (req, res) => {
  if (req.params.id === req.user._id.toString())
    return res.status(400).json({ error: "Can't follow yourself" });
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  const following = req.user.following.map(f => f.toString()).includes(req.params.id);
  if (following) {
    await User.findByIdAndUpdate(req.user._id, { $pull: { following: req.params.id } });
    await User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.user._id } });
    res.json({ following: false });
  } else {
    await User.findByIdAndUpdate(req.user._id, { $push: { following: req.params.id } });
    await User.findByIdAndUpdate(req.params.id, { $push: { followers: req.user._id } });
    socketSvc.createAndEmitNotification(req.params.id, req.user._id, 'follow', null, `@${req.user.username} started following you`);
    res.json({ following: true });
  }
});

// PUT /api/users/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { fullName, bio, avatar, coverImage, location, website, dob } = req.body;
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (dob !== undefined) updateData.dob = dob;
    // Accept base64 avatar (data:image/... URI)
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/notification-prefs
router.put('/notification-prefs', authMiddleware, async (req, res) => {
  try {
    const { securityAlerts, newFollowers, blockchainVerification, marketing } = req.body;
    const prefs = { securityAlerts, newFollowers, blockchainVerification, marketing };
    const user = await User.findByIdAndUpdate(req.user._id, { notificationPrefs: prefs }, { new: true }).select('-password');
    res.json({ success: true, notificationPrefs: user.notificationPrefs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:id/analyze
router.post('/:id/analyze', authMiddleware, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const result = await mlService.detectFake({
    username: user.username, bio: user.bio, avatar: user.avatar,
    postsCount: user.postsCount, followersCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
    accountAge: Math.floor((Date.now() - user.createdAt) / 86400000)
  });
  const vHash = '0x' + crypto.createHash('sha256').update(`${user.accountHash}${result.isFake}${Date.now()}`).digest('hex');
  setImmediate(async () => {
    await blockchain.storeVerification(user.accountHash, vHash, result.isFake, result.confidence, 'rule-based');
    if (result.isFake) await blockchain.flagAccount(user.accountHash, result.reasons.join(', '));
  });
  const updated = await User.findByIdAndUpdate(user._id, {
    fakeScore: result.score, isFlagged: result.isFake,
    $push: { verificationHistory: { verificationHash: vHash, result: result.isFake, confidence: result.confidence, model: 'rule-based', reasons: result.reasons } }
  }, { new: true }).select('-password');
  res.json({ result, user: updated });
});

module.exports = router;
