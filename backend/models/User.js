const mongoose = require('mongoose');
const crypto   = require('crypto');

const userSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true, trim: true, lowercase: true },
  email:       { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:    { type: String, required: true },
  fullName:    { type: String, required: true },
  bio:         { type: String, default: '' },
  avatar:      { type: String, default: '' },
  coverImage:  { type: String, default: '' },
  dob:         { type: Date },
  location:    { type: String, default: '' },
  website:     { type: String, default: '' },
  followers:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blocked:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // users this person has blocked
  // Blockchain
  accountHash:       { type: String },
  blockchainTxHash:  { type: String, default: '' },
  blockchainStatus:  { type: String, enum: ['pending','confirmed','failed','pending_admin'], default: 'pending' },
  // ML / Safety
  fakeScore:    { type: Number, default: 0, min: 0, max: 100 },
  isFlagged:    { type: Boolean, default: false },
  flagReason:   { type: String, default: '' },
  verificationHistory: [{
    verificationHash: String,
    result:     Boolean,
    confidence: Number,
    model:      String,
    reasons:    [String],
    timestamp:  { type: Date, default: Date.now }
  }],
  // Social
  postsCount:   { type: Number, default: 0 },
  isVerified:   { type: Boolean, default: false },
  isOnline:     { type: Boolean, default: false },
  lastSeen:     { type: Date },
  role:         { type: String, enum: ['user','moderator','admin'], default: 'user' },
  isActive:     { type: Boolean, default: true },
  suspendedAt:  { type: Date },
  suspendedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-generate accountHash before first save
userSchema.pre('save', function (next) {
  if (!this.accountHash && this._id) {
    this.accountHash = '0x' + crypto.createHash('sha256')
      .update(`${this._id}${this.email}${this.createdAt || Date.now()}`)
      .digest('hex');
  }
  next();
});

userSchema.virtual('followersCount').get(function () { return this.followers?.length || 0; });
userSchema.virtual('followingCount').get(function () { return this.following?.length || 0; });
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
