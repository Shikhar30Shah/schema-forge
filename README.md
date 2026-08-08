# SchemaForge

AI-Powered Database Migration & API Route Generator

## Overview

SchemaForge is a developer utility app that converts legacy database schema or raw JSON objects into production-ready Express.js routes, Mongoose models, and validator code. It uses a Redux-powered frontend and a Node/Express backend with AI generation.

## Folder structure

- `backend/` - Express server, MongoDB integration, AI generation service
- `frontend/` - Next.js app with Redux Toolkit state management

## Getting started

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Update .env values if needed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` for the frontend. The frontend proxies `/api/*` to `http://localhost:4000`.

## AI Integration

- If `GROQ_API_KEY` is set in `backend/.env`, the backend will call OpenAI to generate code.
- If the key is missing or the AI request fails, SchemaForge falls back to a local synthesis engine.
- The backend exposes a versioned API at `/schema` and includes security headers, compression, rate limiting, and structured error handling.

## Notes

This scaffold is designed to provide static code output in a clean UI with copy-to-clipboard support. It is intentionally built as a developer utility app, not a deployment pipeline.

## Scale and reliability

- `backend/src/config/index.js` centralizes runtime configuration.
- `helmet`, `compression`, `morgan`, and `express-rate-limit` are included for production readiness.
- API request validation is enforced with `express-validator`.
- The system degrades gracefully when AI services fail by using a local code-generation fallback.
