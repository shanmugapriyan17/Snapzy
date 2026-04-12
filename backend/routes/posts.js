const router       = require('express').Router();
const crypto       = require('crypto');
const multer       = require('multer');
const path         = require('path');
const Post         = require('../models/Post');
const User         = require('../models/User');
const ActivityLog  = require('../models/ActivityLog');
const { authMiddleware } = require('../middleware/authMiddleware');
const contentFilter = require('../middleware/contentFilter');
const auditDB      = require('../services/auditDB');
const blockchain   = require('../services/blockchainService');
const socketSvc    = require('../services/socketService');

// ─── Cloudinary config for PERMANENT image uploads ───────────────────────────
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'snapzy_posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, quality: 'auto', fetch_format: 'auto' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ─── Violence / Banned word list (comprehensive) ─────────────────────────────
const VIOLENCE_WORDS = {
  critical: ['kill', 'murder', 'terrorist', 'bomb', 'suicide', 'shoot', 'stab', 'rape', 'assault', 'execute', 'massacre', 'slaughter', 'genocide', 'i will kill', 'gonna kill', 'want to kill', 'i will hurt', 'death threat', 'blow up', 'bomb threat', 'school shooting', 'mass shooting', 'i want to die', 'kms', 'kys', 'kill yourself'],
  high:     ['hate', 'racist', 'racism', 'sexist', 'nazi', 'fascist', 'homophobic', 'slur', 'abuse', 'harass', 'harassment', 'bully', 'bullying', 'threat', 'violence', 'extremist', 'supremacist', 'lynch', 'beat you', 'hurt you', 'terrorist act', 'jihad', 'white supremacy', 'hate crime'],
  medium:   ['stupid', 'idiot', 'moron', 'loser', 'ugly', 'dumb', 'trash', 'worthless', 'pathetic', 'disgusting', 'scam', 'fraud', 'spam', 'porn', 'nsfw', 'fuck', 'fucking', 'fucker', 'motherfucker', 'bitch', 'bastard', 'asshole', 'arsehole', 'shit', 'bullshit', 'crap', 'cunt', 'dick', 'cock', 'pussy', 'whore', 'slut', 'piss', 'pissed', 'faggot', 'fag', 'retard', 'retarded', 'nigger', 'nigga', 'chink', 'spic', 'kike', 'cracker', 'honky'],
  low:      ['hell', 'damn', 'wtf', 'suck', 'lame', 'jerk', 'douchebag', 'wanker', 'twat', 'arse', 'ass', 'crap', 'bloody', 'git', 'numpty', 'shut up', 'loser', 'creep', 'freak', 'weirdo'],
};

function detectViolence(text) {
  const lower = text.toLowerCase();
  const found = [];
  let maxSeverity = null;

  for (const [severity, words] of Object.entries(VIOLENCE_WORDS)) {
    for (const word of words) {
      if (lower.includes(word)) {
        found.push(word);
        if (!maxSeverity || ['critical','high','medium','low'].indexOf(severity) < ['critical','high','medium','low'].indexOf(maxSeverity)) {
          maxSeverity = severity;
        }
      }
    }
  }
  return { flagged: found.length > 0, words: found, severity: maxSeverity };
}

// GET /api/posts/feed
router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const page    = parseInt(req.query.page) || 1;
    const limit   = 20;
    const skip    = (page - 1) * limit;
    const following = (req.user.following || []).concat([req.user._id]);
    const posts = await Post.find({ author: { $in: following }, isHidden: false, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit)
      .populate('author', 'username fullName avatar accountHash isFlagged blockchainStatus')
      .populate('likes', '_id')
      .populate('comments.author', 'username avatar');
    res.json(posts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/posts/explore
router.get('/explore', authMiddleware, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = { isHidden: false, isDeleted: { $ne: true } };
    if (q) filter.content = { $regex: q, $options: 'i' };
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
      .populate('author', 'username fullName avatar accountHash isFlagged blockchainStatus')
      .populate('likes', '_id')
      .populate('comments.author', 'username avatar');
    res.json(posts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/posts/trending
router.get('/trending', authMiddleware, async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await Post.aggregate([
      { $match: { createdAt: { $gte: since }, isDeleted: { $ne: true }, isHidden: false } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/posts — with optional image upload
router.post('/', authMiddleware, upload.single('image'), contentFilter, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });

    // 🚨 Violence / banned word detection for posts
    const detection = detectViolence(content);
    if (detection.flagged) {
      // Log to admin dashboard
      await ActivityLog.create({
        action: 'post_violence_detected', actor: req.user._id, targetType: 'post',
        target: req.user._id,
        details: `⚠️ @${req.user.username} posted violence: [${detection.words.join(', ')}] — "${content.slice(0, 100)}"`,
        severity: detection.severity === 'critical' ? 'critical' : 'warning',
      }).catch(() => {});
    }

    const postData = {
      author: req.user._id, content,
      isFlagged: req.body._isFlagged || detection.flagged,
      moderationScore: req.body._moderationScore || (detection.flagged ? 70 : 0),
      flagReason: (req.body._flagReason ? req.body._flagReason + ' | ' : '') + detection.words.join(', '),
    };

    // Attach uploaded image — Cloudinary gives a permanent HTTPS URL
    if (req.file) {
      postData.media = [{ url: req.file.path, type: 'image' }];
    }

    const post = await Post.create(postData);
    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });

    const populated = await post.populate('author', 'username fullName avatar accountHash blockchainStatus');

    // Activity log
    await ActivityLog.create({ action: 'post_created', actor: req.user._id, target: post._id.toString(), targetType: 'post', details: content.slice(0, 100) });

    // Background blockchain
    setImmediate(async () => {
      try {
        const tx = await blockchain.storePost(req.user.accountHash, post.postHash);
        if (tx) await Post.findByIdAndUpdate(post._id, { blockchainTxHash: tx.hash, blockchainStatus: 'confirmed' });
        const mentions = content.match(/@\w+/g) || [];
        for (const m of mentions) {
          const mentioned = await User.findOne({ username: m.slice(1) });
          if (mentioned) socketSvc.createAndEmitNotification(mentioned._id, req.user._id, 'mention', post._id, `@${req.user.username} mentioned you`);
        }
      } catch { /* noop */ }
    });

    // 🗄️ PERMANENTLY log to SQLite audit DB
    auditDB.logPost({
      authorId: req.user._id, authorName: req.user.username,
      content, mediaUrl: req.file ? `/uploads/${req.file.filename}` : '',
      isFlagged: postData.isFlagged, flagReason: postData.flagReason,
      postHash: post.postHash, bcTxHash: '', createdAt: post.createdAt,
    });

    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/posts/:id/like
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const liked = post.likes.includes(req.user._id);
    if (liked) post.likes.pull(req.user._id);
    else { post.likes.push(req.user._id); socketSvc.createAndEmitNotification(post.author, req.user._id, 'like', post._id, `@${req.user.username} liked your post`); }
    await post.save();
    res.json({ liked: !liked, likesCount: post.likes.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/posts/:id/comment  — with violence detection
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Comment content required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // 🚨 Violence / banned word detection for comments
    const detection = detectViolence(content);
    if (detection.flagged) {
      // Always log to admin dashboard
      const severityLabel = detection.severity === 'critical' ? 'critical' : 'warning';
      await ActivityLog.create({
        action:     'comment_violence_detected',
        actor:      req.user._id,
        targetType: 'comment',
        target:     post._id.toString(),
        details:    `⚠️ @${req.user.username} used violent word(s) in a comment: [${detection.words.join(', ')}] — "${content.slice(0, 120)}"`,
        severity:   severityLabel,
      }).catch(() => {});
    }

    const commentHash = '0x' + crypto.createHash('sha256')
      .update(`${content}${req.user._id}${Date.now()}`)
      .digest('hex');

    post.comments.push({ 
      author: req.user._id, 
      content, 
      commentHash, 
      postHash: post.postHash,
      isFlagged: detection.flagged, 
      flagReason: detection.words.join(', ') 
    });
    
    await post.save();
    socketSvc.createAndEmitNotification(post.author, req.user._id, 'comment', post._id, `@${req.user.username} commented`);
    const updated = await Post.findById(post._id).populate('comments.author', 'username avatar');
    res.json(updated.comments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/posts/:id/comments/:commentId — log violence even on deletion
router.delete('/:id/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const isOwner = comment.author.toString() === req.user._id.toString();
    if (!isOwner && req.user.role === 'user') return res.status(403).json({ error: 'Forbidden' });

    // If comment had violent words, log the deletion too
    const detection = detectViolence(comment.content);
    if (detection.flagged) {
      await ActivityLog.create({
        action:     'violent_comment_deleted',
        actor:      req.user._id,
        targetType: 'comment',
        target:     post._id.toString(),
        details:    `🗑️ @${req.user._id} DELETED a comment containing violent/banned word(s): [${detection.words.join(', ')}] — "${comment.content.slice(0, 120)}"`,
        severity:   detection.severity === 'critical' ? 'critical' : 'warning',
      }).catch(() => {});
    }

    auditDB.logDeletion({
      actorId: req.user._id, actorName: req.user.username,
      targetType: 'comment', targetId: comment._id.toString(),
      contentPreview: comment.content?.slice(0, 200),
      hadViolence: detection.flagged,
      violenceWords: detection.words || [],
      reason: isOwner ? 'Author deleted comment' : 'Post owner deleted comment'
    });

    comment.deleteOne();
    await post.save();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/posts/:id/report
router.post('/:id/report', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    post.isFlagged = true;
    post.flagReason = (post.flagReason ? post.flagReason + '; ' : '') + `Reported by @${req.user.username}: ${req.body.reason || 'No reason'}`;
    await post.save();
    await ActivityLog.create({ action: 'content_reported', actor: req.user._id, target: post._id.toString(), targetType: 'post', details: req.body.reason || '', severity: 'warning' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/posts/:id — soft delete + blockchain record
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    if (post.author.toString() !== req.user._id.toString() && req.user.role === 'user')
      return res.status(403).json({ error: 'Forbidden' });

    // Soft delete
    post.isDeleted = true;
    post.deletedAt = new Date();
    post.deletedBy = req.user._id;
    await post.save();

    // Activity log
    await ActivityLog.create({ action: 'post_deleted', actor: req.user._id, target: post._id.toString(), targetType: 'post', details: `Post "${post.content.slice(0, 60)}..." deleted`, contentHash: post.postHash, severity: 'warning' });

    // 🗄️ PERMANENTLY log to SQLite Audit DB
    auditDB.logDeletion({
      actorId: req.user._id, actorName: req.user.username,
      targetType: 'post', targetId: post._id.toString(),
      contentPreview: post.content?.slice(0, 200),
      contentHash: post.postHash, hadViolence: post.isFlagged,
      reason: 'User deleted post (Soft Delete)'
    });

    // Blockchain deletion record
    setImmediate(async () => {
      try {
        const tx = await blockchain.recordDeletion(post.postHash, req.user.accountHash, 'User deleted post');
        if (tx) {
          await ActivityLog.create({ action: 'blockchain_tx', actor: req.user._id, target: post._id.toString(), targetType: 'post', details: 'Deletion recorded on chain', blockchainTxHash: tx.hash });
        }
      } catch { /* noop */ }
    });

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/posts/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username fullName avatar accountHash isFlagged')
      .populate('comments.author', 'username avatar');
    if (!post) return res.status(404).json({ error: 'Not found' });
    post.views += 1;
    await post.save();
    res.json(post);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
