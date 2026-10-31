const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const User = require('../models/User');
const Request = require('../models/Request');
const Feedback = require('../models/Feedback');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

const DATA_DIR = path.join(__dirname, '../data');

const readJsonFile = (filename) => {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
  }
  return [];
};

const migrate = async () => {
  console.log('🔄 Starting data migration to MongoDB...');
  
  // Connect database
  await connectDB();

  try {
    // 1. Migrate Users
    const localUsers = readJsonFile('users.json');
    console.log(`👤 Found ${localUsers.length} users in users.json`);
    for (const u of localUsers) {
      const exists = await User.findOne({ email: u.email.toLowerCase() });
      if (!exists) {
        // Create new user document
        const newUser = new User(u);
        await newUser.save();
        console.log(`✅ Migrated user: ${u.email}`);
      } else {
        console.log(`ℹ️ User already exists in DB, skipping: ${u.email}`);
      }
    }

    // 2. Migrate Requests
    const localRequests = readJsonFile('requests.json');
    console.log(`🚗 Found ${localRequests.length} requests in requests.json`);
    for (const r of localRequests) {
      const exists = await Request.findOne({ id: r.id });
      if (!exists) {
        const newRequest = new Request(r);
        await newRequest.save();
        console.log(`✅ Migrated request: ${r.id}`);
      } else {
        console.log(`ℹ️ Request already exists in DB, skipping: ${r.id}`);
      }
    }

    // 3. Migrate Feedbacks
    const localFeedbacks = readJsonFile('feedback.json');
    console.log(`⭐ Found ${localFeedbacks.length} feedback items in feedback.json`);
    for (const f of localFeedbacks) {
      const exists = await Feedback.findOne({ id: f.id });
      if (!exists) {
        const newFeedback = new Feedback(f);
        await newFeedback.save();
        console.log(`✅ Migrated feedback: ${f.id}`);
      } else {
        console.log(`ℹ️ Feedback already exists in DB, skipping: ${f.id}`);
      }
    }

    // 4. Migrate Messages
    const localMessages = readJsonFile('messages.json');
    console.log(`💬 Found ${localMessages.length} chat messages in messages.json`);
    for (const m of localMessages) {
      const exists = await Message.findOne({ id: m.id });
      if (!exists) {
        const newMessage = new Message(m);
        await newMessage.save();
        console.log(`✅ Migrated message: ${m.id}`);
      } else {
        console.log(`ℹ️ Message already exists in DB, skipping: ${m.id}`);
      }
    }

    // 5. Migrate Notifications
    const localNotifs = readJsonFile('notifications.json');
    console.log(`🔔 Found ${localNotifs.length} notifications in notifications.json`);
    for (const n of localNotifs) {
      const exists = await Notification.findOne({ id: n.id });
      if (!exists) {
        const newNotif = new Notification(n);
        await newNotif.save();
        console.log(`✅ Migrated notification: ${n.id}`);
      } else {
        console.log(`ℹ️ Notification already exists in DB, skipping: ${n.id}`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
  } catch (err) {
    console.error('\n❌ Error during migration:', err.message);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
    process.exit(0);
  }
};

migrate();
