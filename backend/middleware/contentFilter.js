const mlService = require('../services/mlService');
const ActivityLog = require('../models/ActivityLog');

const contentFilter = async (req, res, next) => {
  try {
    const text = req.body.content || req.body.message || '';
    if (!text.trim()) return next();

    const result = await mlService.moderate(text);
    req.moderationResult = result;

    // Attach to body for downstream use
    req.body._moderationScore   = result.score   || 0;
    req.body._isFlagged         = result.isAbusive || false;
    req.body._flagReason        = result.categories?.join(', ') || '';

    // Auto-notify admin via activity log if severity is high or critical
    if (result.isAbusive && result.severity && ['high', 'critical'].includes(result.severity)) {
      await ActivityLog.create({
        action:     'message_flagged',
        actor:      req.user?._id,
        targetType: 'post',
        details:    `AI flagged content (${result.severity}): "${text.slice(0, 80)}…" | Words: ${result.flaggedWords?.join(', ')}`,
        severity:   result.severity === 'critical' ? 'critical' : 'warning'
      }).catch(() => {});
    }
  } catch {
    req.moderationResult = { isAbusive: false, score: 0 };
  }
  next();
};

module.exports = contentFilter;
