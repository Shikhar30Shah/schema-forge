const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const username = encodeURIComponent(process.env.MONGODB_USERNAME);
const password = encodeURIComponent(process.env.MONGODB_PASSWORD);
const connectionString = `mongodb+srv://${username}:${password}@cluster0.5qrlonn.mongodb.net/?appName=Cluster0`;

const state = { isConnected: false };

async function connectDatabase() {
  if (state.isConnected) {
    console.log('Already connected to MongoDB');
    return;
  }

  try {
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    state.isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

module.exports = {
  connectDatabase,
  state
};
