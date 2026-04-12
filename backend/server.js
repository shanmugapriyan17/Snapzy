require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const blockchain = require('./services/blockchainService');
const socketSvc  = require('./services/socketService');
const seedAdmins = require('./scripts/seed');
require('./services/auditDB'); // Initialize SQLite immutable audit log on startup

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: true, methods: ['GET','POST'], credentials: true }
});

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api/', limiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/posts',         require('./routes/posts'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/messages',      require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/blockchain',    require('./routes/blockchain'));
app.use('/api/audit',         require('./routes/audit'));
app.use('/api/chat',          require('./routes/chat'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', blockchain: blockchain.isReady() }));

// ── Services Init ─────────────────────────────────────────────────────────
socketSvc.init(io);
blockchain.init();

// ── Database + Server Start ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedAdmins();
    server.listen(PORT, () => {
      console.log(`Snapzy API running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
