const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

async function seedAdmins() {
  const User = mongoose.model('User');

  const admins = [
    { username: 'admin1', email: 'admin1@snapzy.io', password: 'admin@123', fullName: 'Admin One',  role: 'admin' },
    { username: 'admin2', email: 'admin2@snapzy.io', password: 'admin@456', fullName: 'Admin Two',  role: 'admin' },
  ];

  for (const a of admins) {
    const exists = await User.findOne({ username: a.username });
    if (exists) {
      console.log(`[Seed] Admin "${a.username}" already exists — skipping.`);
      continue;
    }
    const hash = await bcrypt.hash(a.password, 12);
    const user = await User.create({
      username: a.username,
      email:    a.email,
      password: hash,
      fullName: a.fullName,
      role:     a.role,
      bio:      'Platform Administrator',
      isVerified: true,
    });
    // Generate accountHash (mirrors pre-save hook)
    if (!user.accountHash) {
      user.accountHash = '0x' + crypto.createHash('sha256')
        .update(`${user._id}${user.email}${Date.now()}`)
        .digest('hex');
      await user.save();
    }
    console.log(`[Seed] ✓ Admin "${a.username}" created (password: ${a.password})`);
  }
}

module.exports = seedAdmins;
