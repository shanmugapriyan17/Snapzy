const mongoose = require('mongoose');
const crypto   = require('crypto');

const messageSchema = new mongoose.Schema({
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:  { type: String, default: '' },
  mediaUrl: { type: String, default: '' }, // For image messages
  isRead:   { type: Boolean, default: false },
  readAt:   { type: Date },
  // Soft delete — each side can delete independently
  deletedBySender:   { type: Boolean, default: false },
  deletedByReceiver: { type: Boolean, default: false },
  // Blockchain
  msgHash:           { type: String },
  blockchainTxHash:  { type: String, default: '' },
  blockchainStatus:  { type: String, enum: ['pending','confirmed','failed'], default: 'pending' },
  // Moderation
  isFlagged:        { type: Boolean, default: false },
  flagReason:       { type: String, default: '' },
  moderationScore:  { type: Number, default: 0 },
  violenceWords:    [{ type: String }], // which words triggered the flag
  violenceSeverity: { type: String, default: '' },
}, { timestamps: true });

messageSchema.pre('save', function (next) {
  if (!this.msgHash) {
    this.msgHash = '0x' + crypto.createHash('sha256')
      .update(`${this.content}${this.sender}${this.receiver}${Date.now()}`)
      .digest('hex');
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);
