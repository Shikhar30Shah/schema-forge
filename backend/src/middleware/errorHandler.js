require('dotenv').config();

// Structured error carrying an HTTP status, a stable machine-readable `code`,
// and optional `details` (surfaced to clients as `errorFields`).
class ApiError extends Error {
  constructor(message, { statusCode = 500, code = 'internal_error', details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;

  const payload = {
    message: err.message || 'Internal server error',
    error: err.code || (status >= 500 ? 'internal_error' : 'bad_request'),
  };

  // `details` becomes `errorFields` so clients get structured, actionable info
  // (e.g. the failing Groq model, validation issues, raw response text).
  if (err.details !== undefined) {
    payload.errorFields = err.details;
  }

  // Keep the raw stack only outside production.
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json(payload);
}

module.exports = errorHandler;
module.exports.ApiError = ApiError;
