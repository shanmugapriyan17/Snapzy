const router    = require('express').Router();
const User      = require('../models/User');
const Post      = require('../models/Post');
const Message   = require('../models/Message');
const { authMiddleware } = require('../middleware/authMiddleware');
const blockchain = require('../services/blockchainService');
const auditDB    = require('../services/auditDB');

// GET /api/blockchain/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await blockchain.getStats();
    if (!stats) return res.json({ connected: false });
    const [accounts, posts, messages, verifications, flagged, deletions] = stats;
    res.json({ connected: true, accounts: accounts.toString(), posts: posts.toString(), messages: messages.toString(), verifications: verifications.toString(), flagged: flagged.toString(), deletions: deletions.toString() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/blockchain/verify-post/:hash — checks blockchain first, falls back to SQLite audit DB
router.get('/verify-post/:hash', authMiddleware, async (req, res) => {
  const hash = req.params.hash;
  try {
    // Try blockchain first
    const result = await blockchain.verifyPost(hash);
    if (result) {
      const [exists, accountHash, storedAt] = result;
      if (exists) return res.json({ verified: true, source: 'blockchain', accountHash, storedAt: storedAt.toString() });
    }
  } catch { /* fall through to DB check */ }

  // Fallback: check SQLite audit DB for matching post_hash
  try {
    const auditEntry = auditDB.findPostByHash(hash);
    if (auditEntry) {
      return res.json({
        verified:    true,
        source:      'audit_db',
        author:      auditEntry.author_name,
        content:     auditEntry.content.slice(0, 80) + (auditEntry.content.length > 80 ? '...' : ''),
        isFlagged:   Boolean(auditEntry.is_flagged),
        flagReason:  auditEntry.flag_reason || null,
        createdAt:   auditEntry.created_at,
        recordedAt:  auditEntry.recorded_at,
        note:        'Verified via immutable SQLite audit log (Ethereum node offline)',
      });
    }

    // Also check MongoDB for the post hash
    const post = await Post.findOne({ postHash: hash }).populate('author', 'username fullName');
    if (post) {
      return res.json({
        verified:   true,
        source:     'mongodb',
        author:     post.author?.username,
        content:    post.content?.slice(0, 80),
        isFlagged:  post.isFlagged,
        flagReason: post.flagReason || null,
        createdAt:  post.createdAt,
        note:       'Verified via MongoDB ledger (blockchain node offline)',
      });
    }

    // Also check messages
    const msg = await Message.findOne({ msgHash: hash }).populate('sender', 'username').populate('receiver', 'username');
    if (msg) {
      return res.json({
        verified:   true,
        source:     'mongodb_message',
        sender:     msg.sender?.username,
        receiver:   msg.receiver?.username,
        isFlagged:  msg.isFlagged,
        createdAt:  msg.createdAt,
        note:       'Message hash verified via MongoDB (blockchain node offline)',
      });
    }

    return res.json({ verified: false, source: 'none', note: 'Hash not found in any ledger' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/blockchain/verify-account/:username — checks blockchain first, falls back to DB
router.get('/verify-account/:username', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({
      $or: [{ username: req.params.username }, { accountHash: req.params.username }]
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Try blockchain first
    try {
      const result = await blockchain.verifyAccount(user.accountHash);
      if (result) {
        const [exists, isFlagged, registeredAt] = result;
        if (exists) return res.json({ verified: true, source: 'blockchain', isFlagged, registeredAt: registeredAt.toString(), user: { username: user.username, accountHash: user.accountHash, blockchainTxHash: user.blockchainTxHash, blockchainStatus: user.blockchainStatus } });
      }
    } catch { /* fall through */ }

    // Fallback: use DB record
    return res.json({
      verified:   user.blockchainStatus === 'confirmed',
      source:     'mongodb',
      isFlagged:  user.isFlagged,
      blockchainStatus: user.blockchainStatus,
      note:       'Verified via MongoDB record (blockchain node offline)',
      user: { username: user.username, fullName: user.fullName, accountHash: user.accountHash, blockchainTxHash: user.blockchainTxHash, blockchainStatus: user.blockchainStatus, isVerified: user.isVerified, role: user.role },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

