const mongoose = require('mongoose');
const crypto   = require('crypto');

const activityLogSchema = new mongoose.Schema({
  action:   { type: String, required: true, enum: [
    'user_registered', 'user_suspended', 'user_unsuspended', 'user_deleted',
    'post_created', 'post_deleted', 'post_flagged', 'post_approved', 'post_hidden',
    'message_sent', 'message_flagged',
    'admin_action', 'blockchain_tx', 'content_reported',
    'hash_verification_request', 'admin_approved_verification'
  ]},
  actor:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  target:   { type: String },          // ID or hash of the affected entity
  targetType: { type: String, enum: ['user','post','message','system','account','comment'] },
  details:  { type: String, default: '' },
  blockchainTxHash: { type: String, default: '' },
  contentHash:      { type: String, default: '' },
  severity: { type: String, enum: ['info','warning','critical'], default: 'info' },
}, { timestamps: true });

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ action: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
