const mongoose = require('mongoose');

const DATABASE_NAME = 'roadrescue_db';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.warn('\n⚠️ No MONGODB_URI configured. Starting backend without a database connection.');
      return;
    }

    const conn = await mongoose.connect(mongoUri, { dbName: DATABASE_NAME });
    console.log(`\n🟢 MongoDB Connected: ${conn.connection.host}/${DATABASE_NAME}`);
  } catch (error) {
    console.error(`\n🔴 Database Connection Error: ${error.message}`);
    console.warn('⚠️ Continuing without a database connection. Set MONGODB_URI in backend/.env for full API functionality.');
  }
};

module.exports = connectDB;
