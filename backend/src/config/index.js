require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

function parsePort(value, fallback = 4000) {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map((value) => value.trim()) : ['*'];

module.exports = {
  port: parsePort(process.env.PORT, 4000),
  mongoUri: process.env.MONGODB_URI,
  openAiApiKey: process.env.GROQ_API_KEY || null,
  openAiUrl: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions',
  isProduction,
  requestSizeLimit: '10mb',
  rateLimitOptions: {
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  },
  corsOptions: {
    origin: corsOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
};
