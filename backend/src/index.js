const app = require('./app');
require('dotenv').config();

const { connectDatabase, state } = require('./services/mongodb');
const port = process.env.PORT || 4000;

app.use(async (req, res, next) => {
  if(!state.isConnected)
    await connectDatabase();
  next();
})

module.exports = app;