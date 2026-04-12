require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const DEMO_USERS = [
  { username: 'alice_dev',    email: 'alice@demo.com',    password: 'Alice@123',   fullName: 'Alice Johnson',   bio: '🚀 Full-stack developer & blockchain enthusiast. Building the future!' },
  { username: 'bob_crypto',   email: 'bob@demo.com',      password: 'Bob@1234',    fullName: 'Bob Martinez',    bio: '₿ Crypto trader | DeFi explorer | Web3 builder' },
  { username: 'carol_design', email: 'carol@demo.com',    password: 'Carol@123',   fullName: 'Carol Williams',  bio: '🎨 UI/UX Designer. Making digital experiences beautiful.' },
  { username: 'david_ml',     email: 'david@demo.com',    password: 'David@123',   fullName: 'David Chen',      bio: '🤖 AI & Machine Learning researcher. Python / TensorFlow / PyTorch' },
  { username: 'eva_writer',   email: 'eva@demo.com',      password: 'Eva@12345',   fullName: 'Eva Thompson',    bio: '✍️ Tech blogger & content creator. Writing about Web3 & the future.' },
  { username: 'frank_ops',    email: 'frank@demo.com',    password: 'Frank@123',   fullName: 'Frank Robinson',  bio: '⚙️ DevOps engineer. Infrastructure, CI/CD, and cloud architecture.' },
  { username: 'grace_art',    email: 'grace@demo.com',    password: 'Grace@123',   fullName: 'Grace Lee',       bio: '🎭 Digital artist & NFT creator. Exploring the intersection of art & Web3.' },
  { username: 'henry_sec',    email: 'henry@demo.com',    password: 'Henry@123',   fullName: 'Henry Brown',     bio: '🔐 Cybersecurity analyst. Keeping the web safe one patch at a time.' },
  { username: 'iris_finance', email: 'iris@demo.com',     password: 'Iris@1234',   fullName: 'Iris Garcia',     bio: '💰 FinTech analyst | DeFi protocols | Yield farming strategies' },
  { username: 'jake_mobile',  email: 'jake@demo.com',     password: 'Jake@1234',   fullName: 'Jake Wilson',     bio: '📱 Mobile developer (iOS & Android). React Native enthusiast.' },
];

const DEMO_POSTS = [
  { author: 'alice_dev',    content: 'Just deployed my first smart contract on the local Hardhat node! The future of decentralized apps is here! 🚀 #blockchain #web3 #solidity' },
  { author: 'bob_crypto',   content: 'Bitcoin is holding strong above support! 💪 Remember to always do your own research before investing. #crypto #bitcoin #DYOR' },
  { author: 'carol_design', content: 'Working on a new dark mode UI for a Web3 dashboard. Dark themes + glassmorphism = perfection ✨ #design #uxui #darkmode' },
  { author: 'david_ml',     content: 'Fascinating paper on transformer architecture improvements. The AI revolution is accelerating faster than ever imagined. #AI #machinelearning #research' },
  { author: 'eva_writer',   content: 'Just published my new article: "How blockchain will transform social media forever." Check it out and let me know your thoughts! #writing #blockchain #socialmedia' },
  { author: 'frank_ops',    content: 'Pro tip: Always monitor your blockchain node health with proper alerting. Downtime in Web3 can be costly! ⚙️ #devops #blockchain #infrastructure' },
  { author: 'grace_art',    content: 'My latest NFT collection just dropped! Digital art on the blockchain gives creators true ownership of their work. 🎨 #nft #digitalart #web3' },
  { author: 'henry_sec',    content: 'Important reminder: Never share your private keys! No legitimate platform will EVER ask for them. Stay safe out there. 🔐 #cybersecurity #crypto #safety' },
  { author: 'iris_finance',  content: 'Analyzing the latest DeFi yield farming strategies. High APY with manageable risk is the sweet spot. 📊 #defi #finance #crypto' },
  { author: 'jake_mobile',  content: 'Building a React Native app that integrates with Web3 wallets. Mobile + blockchain is the next big frontier! 📱 #reactnative #mobile #web3' },
];

// Follow structure: who follows whom
const FOLLOW_PAIRS = [
  ['alice_dev',    'bob_crypto'],
  ['alice_dev',    'carol_design'],
  ['alice_dev',    'david_ml'],
  ['bob_crypto',   'alice_dev'],
  ['bob_crypto',   'iris_finance'],
  ['bob_crypto',   'henry_sec'],
  ['carol_design', 'alice_dev'],
  ['carol_design', 'grace_art'],
  ['carol_design', 'eva_writer'],
  ['david_ml',     'alice_dev'],
  ['david_ml',     'eva_writer'],
  ['eva_writer',   'carol_design'],
  ['eva_writer',   'alice_dev'],
  ['frank_ops',    'henry_sec'],
  ['frank_ops',    'david_ml'],
  ['grace_art',    'carol_design'],
  ['grace_art',    'eva_writer'],
  ['henry_sec',    'frank_ops'],
  ['henry_sec',    'alice_dev'],
  ['iris_finance', 'bob_crypto'],
  ['iris_finance', 'david_ml'],
  ['jake_mobile',  'alice_dev'],
  ['jake_mobile',  'carol_design'],
  ['jake_mobile',  'frank_ops'],
];

async function seedDemoUsers() {
  const User = mongoose.model('User');
  const Post = mongoose.model('Post');

  console.log('[Seed] Starting demo user seeding…');
  const userMap = {};

  // Create or fetch all demo users
  for (const u of DEMO_USERS) {
    let user = await User.findOne({ username: u.username });
    if (!user) {
      const hash = await bcrypt.hash(u.password, 12);
      user = await User.create({
        username: u.username,
        email:    u.email,
        password: hash,
        fullName: u.fullName,
        bio:      u.bio,
        role:     'user',
        isActive: true,
        isOnline: false,
      });
      if (!user.accountHash) {
        user.accountHash = '0x' + crypto.createHash('sha256')
          .update(`${user._id}${user.email}${Date.now()}`).digest('hex');
        await user.save();
      }
      console.log(`[Seed] ✓ Created user: @${u.username}`);
    } else {
      console.log(`[Seed] ↩ User @${u.username} already exists — skipping.`);
    }
    userMap[u.username] = user;
  }

  // Set up follow relationships
  console.log('[Seed] Setting up follow relationships…');
  for (const [followerName, followeeName] of FOLLOW_PAIRS) {
    const follower = userMap[followerName];
    const followee = userMap[followeeName];
    if (!follower || !followee) continue;
    if (!follower.following.includes(followee._id)) {
      await User.findByIdAndUpdate(follower._id, { $addToSet: { following: followee._id } });
      await User.findByIdAndUpdate(followee._id, { $addToSet: { followers: follower._id } });
    }
  }
  console.log(`[Seed] ✓ ${FOLLOW_PAIRS.length} follow relationships established.`);

  // Create sample posts
  console.log('[Seed] Creating sample posts…');
  for (const p of DEMO_POSTS) {
    const author = userMap[p.author];
    if (!author) continue;
    const exists = await Post.findOne({ author: author._id, content: p.content });
    if (!exists) {
      await Post.create({ author: author._id, content: p.content });
      console.log(`[Seed] ✓ Post by @${p.author} created.`);
    }
  }

  console.log('[Seed] ✅ Demo seeding complete!');
}

// Standalone execution
if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      require('../models/User');
      require('../models/Post');
      require('../models/ActivityLog');
      await seedDemoUsers();
      process.exit(0);
    })
    .catch(err => { console.error('[Seed] Error:', err); process.exit(1); });
}

module.exports = seedDemoUsers;
