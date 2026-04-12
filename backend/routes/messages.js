const router    = require('express').Router();
const multer    = require('multer');
const path      = require('path');
const Message   = require('../models/Message');
const User      = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');
const ActivityLog = require('../models/ActivityLog');
const auditDB     = require('../services/auditDB');
const blockchain  = require('../services/blockchainService');
const socketSvc   = require('../services/socketService');

// ─── Violence word detection ─────────────────────────────────────────────────
const VIOLENCE_WORDS = {
  critical: ['kill', 'murder', 'terrorist', 'bomb', 'suicide', 'shoot', 'stab', 'rape', 'assault', 'execute', 'massacre', 'slaughter', 'genocide', 'i will kill', 'gonna kill', 'i will hurt', 'blow up', 'death threat', 'bomb threat', 'school shooting', 'i want to die', 'kms', 'kys', 'kill yourself'],
  high:     ['hate', 'racist', 'racism', 'sexist', 'nazi', 'fascist', 'homophobic', 'abuse', 'harass', 'harassment', 'bully', 'bullying', 'threat', 'violence', 'extremist', 'supremacist', 'lynch', 'beat you', 'hurt you', 'hate crime', 'white supremacy'],
  medium:   ['stupid', 'idiot', 'moron', 'loser', 'ugly', 'dumb', 'trash', 'worthless', 'pathetic', 'disgusting', 'scam', 'fraud', 'spam', 'fuck', 'fucking', 'fucker', 'motherfucker', 'bitch', 'bastard', 'asshole', 'shit', 'bullshit', 'cunt', 'dick', 'cock', 'pussy', 'whore', 'slut', 'piss', 'faggot', 'retard', 'nigger', 'nigga', 'chink', 'spic'],
  low:      ['hell', 'damn', 'wtf', 'suck', 'lame', 'jerk', 'douchebag', 'wanker', 'twat', 'arse', 'ass', 'crap', 'bloody', 'shut up', 'creep', 'freak', 'weirdo'],
};

function detectViolence(text) {
  const lower = text.toLowerCase();
  const found = [];
  let maxSeverity = null;
  const order = ['critical', 'high', 'medium', 'low'];
  for (const [severity, words] of Object.entries(VIOLENCE_WORDS)) {
    for (const word of words) {
      if (lower.includes(word)) {
        found.push(word);
        if (!maxSeverity || order.indexOf(severity) < order.indexOf(maxSeverity)) {
          maxSeverity = severity;
        }
      }
    }
  }
  return { flagged: found.length > 0, words: found, severity: maxSeverity };
}

// ─── Multer for image uploads in messages ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve(__dirname, '../uploads')),
  filename:    (req, file, cb) => cb(null, `msg-${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Images only'), ok);
  },
});

// GET /api/messages/conversations
router.get('/conversations', authMiddleware, async (req, res) => {
  const msgs = await Message.aggregate([
    { $match: { $or: [{ sender: req.user._id }, { receiver: req.user._id }] } },
    { $sort: { createdAt: -1 } },
    { $group: {
      _id: { $cond: [{ $eq: ['$sender', req.user._id] }, '$receiver', '$sender'] },
      lastMessage: { $first: '$$ROOT' },
      unreadCount: { $sum: { $cond: [{ $and: [{ $eq: ['$receiver', req.user._id] }, { $eq: ['$isRead', false] }] }, 1, 0] } }
    }},
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { 'user.password': 0 } }
  ]);
  res.json(msgs);
});

// GET /api/messages/:userId
router.get('/:userId', authMiddleware, async (req, res) => {
  const myId    = req.user._id;
  const otherId = req.params.userId;

  const messages = await Message.find({
    $or: [
      { sender: myId, receiver: otherId, deletedBySender: false },
      { sender: otherId, receiver: myId, deletedByReceiver: false },
    ]
  }).sort({ createdAt: 1 })
    .populate('sender', 'username avatar fullName')
    .populate('receiver', 'username avatar fullName');

  // Mark as read
  await Message.updateMany({ sender: otherId, receiver: myId, isRead: false }, { isRead: true, readAt: new Date() });
  // Emit read receipt to sender
  socketSvc.emitToUser(otherId.toString(), 'messages_read', { by: myId });

  res.json(messages);
});

// POST /api/messages — send text or image, with violence detection
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId) return res.status(400).json({ error: 'receiverId required' });
    if (!content?.trim() && !req.file) return res.status(400).json({ error: 'Message or image required' });

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

    // Check if blocked
    const me = await User.findById(req.user._id);
    if (me.blocked?.includes(receiverId) || receiver.blocked?.includes(req.user._id.toString())) {
      return res.status(403).json({ error: 'Cannot send message — user is blocked' });
    }

    // Violence detection
    const detection = content?.trim() ? detectViolence(content) : { flagged: false, words: [], severity: null };

    // Log critical and high severity violent messages to admin
    if (detection.flagged && ['critical', 'high', 'medium'].includes(detection.severity)) {
      await ActivityLog.create({
        action:     'dm_violence_detected',
        actor:      req.user._id,
        targetType: 'message',
        target:     receiverId,
        details:    `⚠️ @${req.user.username} sent ${detection.severity}-severity DM to @${receiver.username}: [${detection.words.join(', ')}] — "${content?.slice(0, 100)}"`,
        severity:   detection.severity === 'critical' ? 'critical' : 'warning',
      }).catch(() => {});
    }

    const msgData = {
      sender:          req.user._id,
      receiver:        receiverId,
      content:         content || '',
      isFlagged:       detection.flagged,
      flagReason:      detection.words.join(', '),
      violenceWords:   detection.words,
      violenceSeverity: detection.severity || '',
      moderationScore: detection.flagged ? 75 : 0,
    };
    if (req.file) msgData.mediaUrl = `/uploads/${req.file.filename}`;

    const msg = await Message.create(msgData);
    const populated = await msg.populate([
      { path: 'sender',   select: 'username avatar fullName' },
      { path: 'receiver', select: 'username avatar fullName' },
    ]);

    // Emit to receiver in real-time
    socketSvc.emitToUser(receiverId, 'new_message', populated);

    // 🗄️ PERMANENTLY log to SQLite audit DB (immutable — cannot be deleted)
    auditDB.logMessage({
      senderId: req.user._id, senderName: req.user.username,
      receiverId, receiverName: receiver.username,
      content: content || '', mediaUrl: req.file ? `/uploads/${req.file.filename}` : '',
      isFlagged: detection.flagged,
      violenceWords: detection.words, violenceSeverity: detection.severity,
      msgHash: msg.msgHash, createdAt: msg.createdAt,
    });

    // Also log violence to audit DB
    if (detection.flagged) {
      auditDB.logViolence({
        actorId: req.user._id, actorName: req.user.username,
        context: 'direct_message',
        violenceWords: detection.words, severity: detection.severity,
        content: content || '', targetId: receiverId, targetName: receiver.username,
        wasBlocked: false,
      });
    }

    // Blockchain in background
    setImmediate(async () => {
      try {
        const senderUser = await User.findById(req.user._id);
        const tx = await blockchain.storeMessage(senderUser.accountHash, receiver.accountHash, msg.msgHash);
        if (tx) await Message.findByIdAndUpdate(msg._id, { blockchainTxHash: tx.hash, blockchainStatus: 'confirmed' });
      } catch { /* noop */ }
    });

    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/messages/:id — soft delete (each side deletes independently)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const isSender   = msg.sender.toString()   === req.user._id.toString();
    const isReceiver = msg.receiver.toString()  === req.user._id.toString();
    if (!isSender && !isReceiver) return res.status(403).json({ error: 'Forbidden' });

    if (isSender)   msg.deletedBySender   = true;
    if (isReceiver) msg.deletedByReceiver = true;

    // If the message had violent words, log the deletion to admin
    if (msg.isFlagged && msg.violenceWords?.length > 0) {
      const other = isSender ? msg.receiver : msg.sender;
      await ActivityLog.create({
        action:     'violent_dm_deleted',
        actor:      req.user._id,
        targetType: 'message',
        target:     other.toString(),
        details:    `🗑️ @${req.user.username} DELETED a violent DM containing [${msg.violenceWords.join(', ')}] — "${msg.content?.slice(0, 100)}"`,
        severity:   msg.violenceSeverity === 'critical' ? 'critical' : 'warning',
      }).catch(() => {});
    }

    // 🗄️ ALWAYS log deletion to SQLite (permanent record of who deleted what)
    auditDB.logDeletion({
      actorId: req.user._id, actorName: req.user.username,
      targetType: 'message', targetId: msg._id.toString(),
      contentPreview: msg.content?.slice(0, 200) || '[image]',
      contentHash: msg.msgHash,
      hadViolence: msg.isFlagged,
      violenceWords: msg.violenceWords || [],
      reason: isSender ? 'deleted by sender' : 'deleted by receiver',
    });

    await msg.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/messages/block/:userId — block a user
router.post('/block/:userId', authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (targetId === req.user._id.toString()) return res.status(400).json({ error: "Can't block yourself" });
    const me = await User.findById(req.user._id);
    const isBlocked = me.blocked?.map(b => b.toString()).includes(targetId);
    if (isBlocked) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { blocked: targetId } });
      res.json({ blocked: false, message: 'User unblocked' });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { blocked: targetId } });
      await ActivityLog.create({
        action: 'user_blocked', actor: req.user._id, targetType: 'user', target: targetId,
        details: `@${req.user.username} blocked a user`, severity: 'info',
      }).catch(() => {});
      
      auditDB.logUser({
        userId: req.user._id, username: req.user.username,
        action: 'block_user', details: `Blocked user ${targetId}`
      });

      res.json({ blocked: true, message: 'User blocked' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
