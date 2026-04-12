const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const User    = require('../models/User');
const blockchain = require('../services/blockchainService');
const mlService  = require('../services/mlService');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName, bio } = req.body;
    if (!username || !email || !password || !fullName)
      return res.status(400).json({ error: 'All fields required' });
    if (await User.findOne({ $or: [{ email }, { username }] }))
      return res.status(400).json({ error: 'Username or email already taken' });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, password: hash, fullName, bio: bio || '' });

    // Background: blockchain registration + initial ML scan
    setImmediate(async () => {
      try {
        const tx = await blockchain.registerAccount(user.accountHash);
        if (tx) await User.findByIdAndUpdate(user._id, { blockchainTxHash: tx.hash, blockchainStatus: 'confirmed' });
        // Initial fake detection
        const mlResult = await mlService.detectFake({
          username, bio: bio || '', avatar: '', postsCount: 0,
          followersCount: 0, followingCount: 0, accountAge: 0
        });
        const vHash = '0x' + crypto.createHash('sha256').update(`${user.accountHash}${mlResult.isFake}${Date.now()}`).digest('hex');
        await blockchain.storeVerification(user.accountHash, vHash, mlResult.isFake, mlResult.confidence, 'rule-based');
        await User.findByIdAndUpdate(user._id, {
          fakeScore: mlResult.score,
          isFlagged: mlResult.isFake,
          $push: { verificationHistory: { verificationHash: vHash, result: mlResult.isFake, confidence: mlResult.confidence, model: 'rule-based', reasons: mlResult.reasons } }
        });
      } catch { /* silent */ }
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user: { id: user._id, username: user.username, fullName: user.fullName, role: user.role, accountHash: user.accountHash } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ error: 'Account suspended' });

    await User.findByIdAndUpdate(user._id, { isOnline: true, lastSeen: new Date() });
    const token = signToken(user._id);
    res.json({ token, user: { id: user._id, username: user.username, fullName: user.fullName, role: user.role, avatar: user.avatar, accountHash: user.accountHash, blockchainStatus: user.blockchainStatus } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/authMiddleware').authMiddleware, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
