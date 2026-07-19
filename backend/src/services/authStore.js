const crypto = require('crypto');
const User = require('../models/user');
const Session = require('../models/Session');
const History = require('../models/History');

const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function createUser({ name, email, password }) {
  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('An account with that email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(password);
  const user = new User({
    name,
    email: normalizedEmail,
    password: hashedPassword,
  });

  await user.save();
  return user;
}

async function findUserByEmail(email) {
  return User.findOne({ email: email.toLowerCase() });
}

async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.password);
}

async function createSession(user) {
  const token = crypto.randomBytes(24).toString('hex');
  const session = new Session({
    userId: user.id,
    token,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24, // 24h expiration
  });
  await session.save();
  return token;
}

async function getSession(token) {
  const session = await Session.findOne({ token });
  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    await Session.deleteOne({ token });
    return null;
  }

  return session;
}

async function getUserById(userId) {
  return User.findById(userId) || null;
}

async function clearSession(token) {
  await Session.deleteOne({ token });
}

async function saveHistoryEntry(userId, payload) {
  const entry = new History({
    userId,
    source: payload.source || '',
    models: payload.models || '',
    routes: payload.routes || '',
    validators: payload.validators || '',
    summary: payload.summary || '',
    sourceType: payload.sourceType || 'schema',
    createdAt: new Date(),
  });

  await entry.save();
  return entry;
}

async function getHistory(userId) {
  return History.find({ userId }).sort({ createdAt: -1 });
}

module.exports = {
  createUser,
  findUserByEmail,
  verifyPassword,
  createSession,
  getSession,
  getUserById,
  clearSession,
  saveHistoryEntry,
  getHistory,
};
