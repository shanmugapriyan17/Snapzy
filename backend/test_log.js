
const mongoose = require('mongoose');
require('dotenv').config();
const ActivityLog = require('./models/ActivityLog');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus');
  console.log('Connected');
  try {
    const log = await ActivityLog.create({
      action: 'hash_verification_request',
      actor: '65e381000000000000000000', // valid fake ID
      targetType: 'post',
      target: '0x123',
      details: 'Test details',
    });
    console.log('Successfully created:', log._id);
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit();
}
run();
