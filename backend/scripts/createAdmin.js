const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/User');

const DATABASE_NAME = 'roadrescue_db';

class AdminCreationError extends Error {}

const ask = (rl, prompt) =>
  new Promise((resolve) => rl.question(prompt, resolve));

const askSecret = (prompt) => new Promise((resolve, reject) => {
  readline.emitKeypressEvents(process.stdin);
  try {
    process.stdin.setRawMode(true);
  } catch {
    reject(new AdminCreationError('Could not enable hidden password input. Run this command in an interactive terminal.'));
    return;
  }
  process.stdin.resume();
  process.stdout.write(prompt);

  let value = '';
  const cleanup = () => {
    process.stdin.off('keypress', onKeypress);
    if (process.stdin.isTTY && typeof process.stdin.setRawMode === 'function') {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
    process.stdout.write('\n');
  };
  const onKeypress = (character, key = {}) => {
    if (key.ctrl && key.name === 'c') {
      cleanup();
      reject(new Error('Cancelled.'));
    } else if (key.name === 'return' || key.name === 'enter') {
      cleanup();
      resolve(value);
    } else if (key.name === 'backspace') {
      value = value.slice(0, -1);
    } else if (character && !key.ctrl && !key.meta) {
      value += character;
    }
  };

  process.stdin.on('keypress', onKeypress);
});

const getSafeErrorMessage = (error) => {
  if (error instanceof AdminCreationError) return error.message;

  if (error?.code === 11000) {
    return 'An account already uses that email or a unique account identifier conflicted. No existing account was changed.';
  }

  if (error?.name === 'ValidationError') {
    const fields = Object.keys(error.errors || {});
    return fields.length
      ? `Account validation failed for: ${fields.join(', ')}. Check the entered details.`
      : 'Account validation failed. Check the entered details.';
  }

  if (error?.code === 18 || error?.codeName === 'AuthenticationFailed') {
    return 'MongoDB rejected the configured database credentials. Check the database user and permissions in backend/.env.';
  }

  if (error?.code === 13 || error?.codeName === 'Unauthorized') {
    return 'The configured MongoDB user does not have permission to create or read users in the selected database.';
  }

  if (error?.name === 'MongoServerSelectionError' || error?.name === 'MongoNetworkError') {
    return 'Could not connect to MongoDB. Check that the database is running, the network/IP access list permits this machine, and backend/.env points to the intended database.';
  }

  if (error?.name === 'MongoParseError' || error?.name === 'MongoInvalidArgumentError') {
    return 'The MongoDB connection configuration is invalid. Check the format of MONGODB_URI in backend/.env.';
  }

  return 'Admin account creation failed due to an unexpected error. No password or connection details were logged.';
};

async function createAdmin() {
  if (!process.stdin.isTTY || !process.stdout.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new AdminCreationError('This command requires an interactive terminal. Open a terminal and run: node scripts/createAdmin.js');
  }

  if (!process.env.MONGODB_URI) {
    throw new AdminCreationError('MONGODB_URI is not configured in backend/.env.');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: DATABASE_NAME,
      serverSelectionTimeoutMS: 10000,
    });
  } catch (error) {
    throw new AdminCreationError(getSafeErrorMessage(error));
  }
  console.log(`Connected to MongoDB database: ${DATABASE_NAME}`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let fullName;
  let email;
  let phone;
  try {
    fullName = (await ask(rl, 'Admin full name: ')).trim();
    email = (await ask(rl, 'Admin email: ')).trim().toLowerCase();
    phone = (await ask(rl, 'Admin phone: ')).trim();
  } finally {
    rl.close();
  }

  if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone) {
    throw new AdminCreationError('A name, valid email, and phone number are required.');
  }

  const password = await askSecret('Admin password (input hidden): ');
  const confirmation = await askSecret('Confirm password (input hidden): ');
  if (password.length < 12) {
    throw new AdminCreationError('Use a password with at least 12 characters.');
  }
  if (password !== confirmation) {
    throw new AdminCreationError('Passwords do not match.');
  }

  const existingUser = await User.findOne({ email }).select('_id').lean();
  if (existingUser) {
    throw new AdminCreationError('An account already uses that email. Choose a different email; no account was changed.');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await User.create({
    fullName,
    email,
    phone,
    password: hashedPassword,
    role: 'ADMIN',
    isActive: true,
    verificationStatus: 'APPROVED',
  });

  console.log('Admin account created. Sign in through the app with the credentials you entered.');
}

createAdmin()
  .catch((error) => {
    console.error(`Admin account was not created: ${getSafeErrorMessage(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
