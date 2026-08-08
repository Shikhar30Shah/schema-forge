const app = require('./app');
require('dotenv').config();

const { connectDatabase } = require('./services/mongodb');
const port = process.env.PORT || 4000;

// Initialize DB connection immediately when the serverless function loads
// This ensures the connection is ready before any request hits the middleware
let dbConnectionPromise = null;

const handler = async (req, res, next) => {
  try {
    if (!dbConnectionPromise) {
      dbConnectionPromise = connectDatabase();
    }
    await dbConnectionPromise;
    next();
  } catch (error) {
    console.error('DB Connection Failed:', error);
    res.status(503).json({ error: 'Database unavailable' });
  }
};

// Apply DB check middleware
app.use(handler);

// For Vercel serverless exports (if using vercel.json or automatic detection)
module.exports = app;

// If you run this as a standalone server locally:
if (process.env.NODE_ENV !== 'production') {
  connectDatabase()
    .then(() => {
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    })
    .catch(err => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}