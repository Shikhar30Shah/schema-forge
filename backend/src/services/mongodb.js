const mongoose = require('mongoose');

const username = encodeURIComponent(process.env.MONGODB_USERNAME);
const password = encodeURIComponent(process.env.MONGODB_PASSWORD);
// Ensure appName is URL-encoded if it contains special characters, though usually fine
const connectionString = `mongodb+srv://${username}:${password}@cluster0.5qrlonn.mongodb.net/?appName=Cluster0`;

// Use global to cache connection across serverless invocations
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDatabase() {
  if (cached.conn) {
    // Check if connection is actually ready (readyState 1 = connected)
    if (cached.conn.readyState === 1) {
      return cached.conn;
    }
    // If connection exists but is disconnected, reset promise
    cached.promise = null;
  }

  if (!cached.promise) {
    // Create new connection promise ONLY if one doesn't exist
    // REMOVED deprecated options: useNewUrlParser, useUnifiedTopology
    cached.promise = mongoose.connect(connectionString, {
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 5,        // Limit connections per instance
      serverSelectionTimeoutMS: 5000, // Fail fast if DB unreachable
      socketTimeoutMS: 45000,
    }).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Reset promise on failure so next request retries
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

module.exports = {
  connectDatabase,
  state: { get isConnected() { return cached.conn?.readyState === 1; } }
};   