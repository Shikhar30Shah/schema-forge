const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const generateRoute = require('./routes/generate');
const authRoute = require('./routes/auth');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors(config.corsOptions));
app.use(compression());
app.use(express.json({ limit: config.requestSizeLimit }));
app.use(express.urlencoded({ extended: true }));

if (!config.isProduction) {
  app.use(morgan('dev'));
}

app.get('/schema/health', (req, res) => {
  res.json({ status: 'ok', service: 'SchemaForge AI Generator' });
});

app.use('/schema', console.log('Applying rate limiting middleware with options:', config.rateLimitOptions) || rateLimit(config.rateLimitOptions));

app.use(
  '/schema',
  rateLimit(config.rateLimitOptions)
);

app.use('/schema/generate', generateRoute);
app.use('/schema/auth', authRoute);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
