const axios = require('axios');

const GEMINI_API_KEY_MIDDLE = process.env.GEMINI_API_KEY_MIDDLE;
const GEMINI_API_KEY_SIDEBAR = process.env.GEMINI_API_KEY_SIDEBAR;

const getGeminiUrl = (isSidebar) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${isSidebar ? GEMINI_API_KEY_SIDEBAR : GEMINI_API_KEY_MIDDLE}`;

// Try models in order — each has its own daily quota
const MODELS = [
  'gemini-2.5-flash-preview-04-17',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
];

const makeUrl = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

function* getAttempts(preferSidebar) {
  const keys = preferSidebar
    ? [GEMINI_API_KEY_SIDEBAR, GEMINI_API_KEY_MIDDLE]
    : [GEMINI_API_KEY_MIDDLE, GEMINI_API_KEY_SIDEBAR];
  for (const model of MODELS) {
    for (const key of keys) {
      yield { model, key };
    }
  }
}

async function geminiPost(payload, preferSidebar = false) {
  let lastErr;
  for (const { model, key } of getAttempts(preferSidebar)) {
    try {
      const { data } = await axios.post(makeUrl(model, key), payload, { timeout: 25000 });
      return data;
    } catch (err) {
      const status = err.response?.status;
      console.warn(`[Gemini] ${model} key=...${key.slice(-6)} -> ${status || err.code}`);
      lastErr = err;
      if (status !== 429 && status !== 503 && status !== 404) break;
    }
  }
  throw lastErr;
}

/* ── Smart offline fallback: keyword-aware Szy responses ─────── */
function getOfflineReply(message) {
  const m = (message || '').toLowerCase();
  if (m.includes('blockchain') || m.includes('hash') || m.includes('sha'))
    return 'Snapzy uses SHA-256 cryptographic hashing to anchor every post, comment, and message to an immutable on-chain ledger. Each content piece gets a unique hex hash recorded in our Hardhat smart contract. You can verify any hash in the Blockchain tab! ⛓';
  if (m.includes('delete') || m.includes('deletion') || m.includes('remove'))
    return 'All deletions on Snapzy are soft-deletes: the content is hidden from the UI but the original SHA-256 hash and deletion event are permanently recorded in the immutable SQLite audit log and blockchain. Admins can verify deletion integrity in the Admin Hub. 🗑️';
  if (m.includes('moderat') || m.includes('violenc') || m.includes('flag') || m.includes('toxic'))
    return "Snapzy's AI moderation uses Gemini AI to detect toxic content in real-time. Posts and messages are scored for violence, hate speech, and abuse. Critical violations are flagged, logged to the SQLite audit trail, and reported to admins. I am the intelligence layer behind this! 🛡️";
  if (m.includes('report') || m.includes('comment'))
    return 'Post owners can report comments on their posts. Comments get flagged in the database and logged in the activity feed. Only the comment author or admins can delete comments. All actions create an immutable audit record. 📋';
  if (m.includes('message') || m.includes('dm') || m.includes('direct'))
    return 'Every direct message on Snapzy is SHA-256 hashed and blockchain-anchored. Messages support image sharing, violence detection, and read receipts. Deleted messages leave an immutable deletion record in the audit log. 💬';
  if (m.includes('hello') || m.includes('hi') || m.includes('hey') || m.includes('who are you'))
    return 'Hello! I am Szy, the AI Protocol Guide for Snapzy. I handle content moderation, blockchain oracle services, and answer questions about the platform. My Gemini AI engine is currently rate-limited (daily quota), but I am here in offline mode! What would you like to know? 🤖';
  if (m.includes('snapzy') || m.includes('platform') || m.includes('network'))
    return 'Snapzy is a decentralised, AI-moderated social network with blockchain-anchored content. Every post, comment, and message gets a SHA-256 hash on the Ethereum ledger. Features: immutable audit logs, AI content moderation, blockchain hash verification, DM encryption indicators, and an admin dashboard with SQLite audit trails. ⛓';
  if (m.includes('admin') || m.includes('audit') || m.includes('log'))
    return "Snapzy's Admin Hub provides: real-time activity logs, SQLite immutable deletion records (posts and comments), violence detection reports, blockchain hash verification, and user management. All events are permanently stored even after deletion. 🛡️";
  const generic = [
    'My Gemini AI brain is cooling down (daily quota exhausted). All Snapzy data is secured with SHA-256 hashes anchored on-chain. Please try again after midnight UTC when the quota resets! ⛓',
    'The AI quota is temporarily exhausted. Every Snapzy post is immutably hashed, AI-moderated, and verifiable on our Hardhat blockchain. Try again shortly! 🤖',
    'Rate limit reached on all Gemini endpoints. Snapzy blockchain verification, AI moderation, and audit systems are still running fine. Please retry in a few minutes! 🛡️',
  ];
  return generic[Math.floor(Date.now() / 1000) % generic.length];
}

const mlService = {
  async detectFake(profileData) {
    try {
      const prompt = `Analyze this profile data for authenticity. Respond STRICTLY in JSON format with exactly these keys: { "isFake": boolean, "score": number(0-100), "confidence": number(0-100), "reasons": string[] }. Profile: ${JSON.stringify(profileData)}`;
      const data = await geminiPost({ contents: [{ parts: [{ text: prompt }] }] });
      const text = data.candidates[0].content.parts[0].text;
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (err) {
      console.error('[Gemini] detectFake:', err.response?.data?.error?.message || err.message);
      return { isFake: false, score: 0, confidence: 0, reasons: [] };
    }
  },

  async moderate(text) {
    try {
      const prompt = `Toxicity detection: Is this text abusive, toxic, or spam? Respond STRICTLY in JSON: { "isAbusive": boolean, "score": number(0-100), "categories": string[], "flaggedWords": string[] }. Text: "${text}"`;
      const data = await geminiPost({ contents: [{ parts: [{ text: prompt }] }] });
      const raw = data.candidates[0].content.parts[0].text;
      return JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (err) {
      console.error('[Gemini] moderate:', err.response?.data?.error?.message || err.message);
      return { isAbusive: false, score: 0, categories: [], flaggedWords: [] };
    }
  },

  async szyChat(message, history = [], isSidebar = false) {
    const formattedHistory = (history || [])
      .map(m => `[${(m.role || 'user').toUpperCase()}]: ${m.text || ''}`)
      .join('\n');

    const promptContext = `You are "Szy", the AI Protocol Guide for Snapzy - a blockchain-anchored social network with SHA-256 immutable audit logs, AI content moderation, and smart contract integration.
Be concise (under 150 words), technically precise, and helpful.
Conversation History:
${formattedHistory}
[USER]: "${message}"
[SZY]:`;

    try {
      const data = await geminiPost(
        { contents: [{ parts: [{ text: promptContext }] }] },
        isSidebar
      );
      return { reply: data.candidates[0].content.parts[0].text.trim(), isOffline: false };
    } catch (err) {
      const status = err.response?.status;
      console.warn(`[Gemini] szyChat: all keys exhausted. Status=${status}`);
      if (status === 429 || status === 503) {
        return { reply: getOfflineReply(message), isOffline: true };
      }
      throw err;
    }
  }
};

module.exports = mlService;
