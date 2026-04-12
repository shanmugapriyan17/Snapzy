/**
 * ImmutableAuditDB — SQLite-based append-only audit log.
 *
 * DESIGN RULES:
 *  - NEVER DELETE any row. This is a permanent, tamper-evident log.
 *  - NEVER UPDATE any row. All events are immutable once written.
 *  - Every sensitive action (post, message, delete, block, login, violence) is recorded here.
 *  - This acts as the secondary source of truth alongside blockchain.
 */

const Database = require('better-sqlite3');
const path     = require('path');
const crypto   = require('crypto');

const DB_PATH = path.resolve(__dirname, '../data/audit.sqlite');

// Ensure the data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ─────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_messages (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id      TEXT    NOT NULL UNIQUE,
    sender_id     TEXT    NOT NULL,
    sender_name   TEXT    NOT NULL,
    receiver_id   TEXT    NOT NULL,
    receiver_name TEXT    NOT NULL,
    content       TEXT    NOT NULL,
    media_url     TEXT    DEFAULT '',
    is_flagged    INTEGER DEFAULT 0,
    violence_words TEXT   DEFAULT '',
    violence_severity TEXT DEFAULT '',
    msg_hash      TEXT    NOT NULL,
    created_at    TEXT    NOT NULL,
    recorded_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_posts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id      TEXT    NOT NULL UNIQUE,
    author_id     TEXT    NOT NULL,
    author_name   TEXT    NOT NULL,
    content       TEXT    NOT NULL,
    media_url     TEXT    DEFAULT '',
    is_flagged    INTEGER DEFAULT 0,
    flag_reason   TEXT    DEFAULT '',
    post_hash     TEXT    NOT NULL,
    bc_tx_hash    TEXT    DEFAULT '',
    created_at    TEXT    NOT NULL,
    recorded_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_deletions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id      TEXT    NOT NULL UNIQUE,
    actor_id      TEXT    NOT NULL,
    actor_name    TEXT    NOT NULL,
    target_type   TEXT    NOT NULL,
    target_id     TEXT    NOT NULL,
    content_preview TEXT  DEFAULT '',
    content_hash  TEXT    DEFAULT '',
    had_violence  INTEGER DEFAULT 0,
    violence_words TEXT   DEFAULT '',
    reason        TEXT    DEFAULT '',
    deleted_at    TEXT    NOT NULL,
    recorded_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id      TEXT    NOT NULL UNIQUE,
    user_id       TEXT    NOT NULL,
    username      TEXT    NOT NULL,
    action        TEXT    NOT NULL,
    details       TEXT    DEFAULT '',
    ip_address    TEXT    DEFAULT '',
    recorded_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_violence (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id      TEXT    NOT NULL UNIQUE,
    actor_id      TEXT    NOT NULL,
    actor_name    TEXT    NOT NULL,
    context       TEXT    NOT NULL,
    violence_words TEXT   NOT NULL,
    severity      TEXT    NOT NULL,
    content       TEXT    NOT NULL,
    target_id     TEXT    DEFAULT '',
    target_name   TEXT    DEFAULT '',
    was_blocked   INTEGER DEFAULT 0,
    recorded_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Prepared statements (append-only)
const stmts = {
  insertMessage: db.prepare(`
    INSERT OR IGNORE INTO audit_messages
      (event_id, sender_id, sender_name, receiver_id, receiver_name, content, media_url, is_flagged, violence_words, violence_severity, msg_hash, created_at)
    VALUES
      (@event_id, @sender_id, @sender_name, @receiver_id, @receiver_name, @content, @media_url, @is_flagged, @violence_words, @violence_severity, @msg_hash, @created_at)
  `),

  insertPost: db.prepare(`
    INSERT OR IGNORE INTO audit_posts
      (event_id, author_id, author_name, content, media_url, is_flagged, flag_reason, post_hash, bc_tx_hash, created_at)
    VALUES
      (@event_id, @author_id, @author_name, @content, @media_url, @is_flagged, @flag_reason, @post_hash, @bc_tx_hash, @created_at)
  `),

  insertDeletion: db.prepare(`
    INSERT OR IGNORE INTO audit_deletions
      (event_id, actor_id, actor_name, target_type, target_id, content_preview, content_hash, had_violence, violence_words, reason, deleted_at)
    VALUES
      (@event_id, @actor_id, @actor_name, @target_type, @target_id, @content_preview, @content_hash, @had_violence, @violence_words, @reason, @deleted_at)
  `),

  insertUser: db.prepare(`
    INSERT OR IGNORE INTO audit_users
      (event_id, user_id, username, action, details, ip_address)
    VALUES
      (@event_id, @user_id, @username, @action, @details, @ip_address)
  `),

  insertViolence: db.prepare(`
    INSERT OR IGNORE INTO audit_violence
      (event_id, actor_id, actor_name, context, violence_words, severity, content, target_id, target_name, was_blocked)
    VALUES
      (@event_id, @actor_id, @actor_name, @context, @violence_words, @severity, @content, @target_id, @target_name, @was_blocked)
  `),
};

// Query helpers (read-only)
const queries = {
  recentMessages:  db.prepare('SELECT * FROM audit_messages ORDER BY recorded_at DESC LIMIT ?'),
  recentPosts:     db.prepare('SELECT * FROM audit_posts ORDER BY recorded_at DESC LIMIT ?'),
  recentDeletions: db.prepare('SELECT * FROM audit_deletions ORDER BY recorded_at DESC LIMIT ?'),
  recentViolence:  db.prepare('SELECT * FROM audit_violence ORDER BY recorded_at DESC LIMIT ?'),
  recentUsers:     db.prepare('SELECT * FROM audit_users ORDER BY recorded_at DESC LIMIT ?'),
  stats:           db.prepare('SELECT (SELECT COUNT(*) FROM audit_messages) as messages, (SELECT COUNT(*) FROM audit_posts) as posts, (SELECT COUNT(*) FROM audit_deletions) as deletions, (SELECT COUNT(*) FROM audit_violence) as violence_events, (SELECT COUNT(*) FROM audit_users) as user_events'),
  searchMessages:  db.prepare("SELECT * FROM audit_messages WHERE content LIKE ? OR sender_name LIKE ? OR receiver_name LIKE ? ORDER BY recorded_at DESC LIMIT 50"),
};

function genEventId() {
  return crypto.randomBytes(16).toString('hex');
}

const auditDB = {
  /** Record a sent message permanently */
  logMessage({ senderId, senderName, receiverId, receiverName, content, mediaUrl, isFlagged, violenceWords, violenceSeverity, msgHash, createdAt }) {
    try {
      stmts.insertMessage.run({
        event_id: genEventId(),
        sender_id: String(senderId), sender_name: String(senderName || ''),
        receiver_id: String(receiverId), receiver_name: String(receiverName || ''),
        content: String(content || ''), media_url: String(mediaUrl || ''),
        is_flagged: isFlagged ? 1 : 0,
        violence_words: String(Array.isArray(violenceWords) ? violenceWords.join(', ') : (violenceWords || '')),
        violence_severity: String(violenceSeverity || ''),
        msg_hash: String(msgHash || ''), created_at: String(createdAt ? new Date(createdAt).toISOString() : new Date().toISOString()),
      });
    } catch (e) { console.error('[AuditDB] logMessage error:', e.message); }
  },

  /** Record a post creation permanently */
  logPost({ authorId, authorName, content, mediaUrl, isFlagged, flagReason, postHash, bcTxHash, createdAt }) {
    try {
      stmts.insertPost.run({
        event_id: genEventId(),
        author_id: String(authorId), author_name: String(authorName || ''),
        content: String(content || ''), media_url: String(mediaUrl || ''),
        is_flagged: isFlagged ? 1 : 0, flag_reason: String(flagReason || ''),
        post_hash: String(postHash || ''), bc_tx_hash: String(bcTxHash || ''),
        created_at: String(createdAt ? new Date(createdAt).toISOString() : new Date().toISOString()),
      });
    } catch (e) { console.error('[AuditDB] logPost error:', e.message); }
  },

  /** Record a deletion action permanently — WHO deleted WHAT */
  logDeletion({ actorId, actorName, targetType, targetId, contentPreview, contentHash, hadViolence, violenceWords, reason }) {
    try {
      stmts.insertDeletion.run({
        event_id: genEventId(),
        actor_id: String(actorId), actor_name: String(actorName || ''),
        target_type: String(targetType || ''), target_id: String(targetId),
        content_preview: String((contentPreview || '').slice(0, 200)),
        content_hash: String(contentHash || ''),
        had_violence: hadViolence ? 1 : 0,
        violence_words: String(Array.isArray(violenceWords) ? violenceWords.join(', ') : (violenceWords || '')),
        reason: String(reason || ''), deleted_at: String(new Date().toISOString()),
      });
    } catch (e) { console.error('[AuditDB] logDeletion error:', e.message); }
  },

  /** Record a violence event permanently */
  logViolence({ actorId, actorName, context, violenceWords, severity, content, targetId, targetName, wasBlocked }) {
    try {
      stmts.insertViolence.run({
        event_id: genEventId(),
        actor_id: String(actorId), actor_name: String(actorName || ''),
        context: String(context || ''), violence_words: String(Array.isArray(violenceWords) ? violenceWords.join(', ') : (violenceWords || '')),
        severity: String(severity || ''), content: String((content || '').slice(0, 500)),
        target_id: String(targetId || ''), target_name: String(targetName || ''),
        was_blocked: wasBlocked ? 1 : 0,
      });
    } catch (e) { console.error('[AuditDB] logViolence error:', e.message); }
  },

  /** Record a user action (login, follow, block, register) */
  logUser({ userId, username, action, details, ipAddress }) {
    try {
      stmts.insertUser.run({
        event_id: genEventId(),
        user_id: String(userId), username: String(username || ''),
        action: String(action || ''), details: String(details || ''), ip_address: String(ipAddress || ''),
      });
    } catch (e) { console.error('[AuditDB] logUser error:', e.message); }
  },

  // ─── Read API ──────────────────────────────────────────────────────────────
  getRecentMessages:  (limit = 50) => queries.recentMessages.all(limit),
  getRecentPosts:     (limit = 50) => queries.recentPosts.all(limit),
  getRecentDeletions: (limit = 50) => queries.recentDeletions.all(limit),
  getRecentViolence:  (limit = 50) => queries.recentViolence.all(limit),
  getRecentUsers:     (limit = 50) => queries.recentUsers.all(limit),
  getStats:           ()           => queries.stats.get(),
  searchMessages:     (q)          => queries.searchMessages.all(`%${q}%`, `%${q}%`, `%${q}%`),
  // Hash lookup fallbacks for offline blockchain verification
  findPostByHash:    (hash) => db.prepare('SELECT * FROM audit_posts WHERE post_hash = ? LIMIT 1').get(hash),
  findMessageByHash: (hash) => db.prepare('SELECT * FROM audit_messages WHERE msg_hash = ? LIMIT 1').get(hash),
};

console.log('[AuditDB] SQLite immutable audit log ready at', DB_PATH);
module.exports = auditDB;
