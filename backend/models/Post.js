const mongoose = require('mongoose');
const crypto   = require('crypto');

const commentSchema = new mongoose.Schema({
  author:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:     { type: String, required: true },
  commentHash: { type: String }, // Cryptographic anchor for the immutable ledger
  postHash:    { type: String },
  likes:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isFlagged:   { type: Boolean, default: false },
  flagReason:  { type: String, default: '' }
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:   { type: String, required: true, maxlength: 2000 },
  media:     [{ url: String, type: { type: String, enum: ['image','video'] } }],
  hashtags:  [{ type: String }],
  mentions:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reposts:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments:  [commentSchema],
  // Blockchain
  postHash:          { type: String },
  blockchainTxHash:  { type: String, default: '' },
  blockchainStatus:  { type: String, enum: ['pending','confirmed','failed'], default: 'pending' },
  // Moderation
  isFlagged:       { type: Boolean, default: false },
  flagReason:      { type: String, default: '' },
  moderationScore: { type: Number, default: 0 },
  isHidden:        { type: Boolean, default: false },
  isDeleted:       { type: Boolean, default: false },
  deletedAt:       { type: Date },
  deletedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  views:           { type: Number, default: 0 },
}, { timestamps: true });

postSchema.pre('save', function (next) {
  if (!this.postHash) {
    this.postHash = '0x' + crypto.createHash('sha256')
      .update(`${this.content}${this.author}${Date.now()}`)
      .digest('hex');
  }
  // Extract hashtags
  if (this.isModified('content')) {
    this.hashtags = (this.content.match(/#\w+/g) || []).map(t => t.toLowerCase());
  }
  next();
});

postSchema.set('toJSON', { virtuals: true });
postSchema.virtual('likesCount').get(function () { return this.likes?.length || 0; });
postSchema.virtual('commentsCount').get(function () { return this.comments?.length || 0; });

module.exports = mongoose.model('Post', postSchema);
