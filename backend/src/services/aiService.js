const { createFallbackOutput } = require('../utils/generator');
const { ApiError } = require('../middleware/errorHandler');

// ------------------------------------------------------------------
// Configuration constants
// ------------------------------------------------------------------
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const GROQ_TEXT_MODEL = process.env.GROQ_TEXT_MODEL || 'llama-3.3-70b-versatile';
const GROQ_VISION_MODEL =
  process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-19b-17b-vision-preview';

// Core prompt shared by text and image paths
const CORE_PROMPT = `You are a senior full-stack engineer generating production Node.js code from a schema/JSON sample.

The source may contain ONE or MULTIPLE entities/collections (e.g. users, posts, creators). Detect every distinct entity in the source and generate a complete, separate set of files for EACH one — never merge multiple entities into a single model/route/validator file, and never skip an entity that appears in the source.

RULES (apply per entity):
- Infer precise Mongoose types (String, Number, Boolean, Date, ObjectId, Array, nested Schema). Only use Schema.Types.Mixed if a field's shape is truly unpredictable — never as a default.
- Always "const mongoose = require('mongoose'); const { Schema } = mongoose;" — never reference Schema without importing it.
- Model name: PascalCase singular, derived from the entity (e.g. "posts" array → "Post").
- If one entity references another (e.g. post.authorId → user), use Schema.Types.ObjectId with the correct "ref".
- Routes: full CRUD (GET all, GET :id, POST, PUT :id, DELETE :id), wrapped in try/catch, correct status codes (200/201/400/404/500), mounted on a base path derived from the entity (e.g. "/api/posts").
- Validators: express-validator array matching that entity's fields 1:1, exported for use as router middleware.
- Field names/types must be identical across that entity's model, route, and validator.
- Services: generate a service file for each entity that contains the business logic for CRUD operations, separate from the route handlers. Each service should export functions for create, read, update, and delete operations, and should handle any necessary data transformations or validations understanding the context of the json or schema.

OUTPUT FORMAT:
Return ONLY a single valid JSON object, no markdown fences, no prose outside it, matching exactly this shape:
{
  "entities": [
    {
      "name": "<entity name, e.g. 'user'>",
      "models": "<full model file as a string, \\n for newlines>",
      "routes": "<full router file as a string>",
      "validators": "<full validator file as a string>",
      "services": "<full service file as a string, if applicable, otherwise empty string>"
    }
  ],
  "summary": "<2-3 sentences covering all entities generated and any relationships detected>"
}
- "entities" must have exactly one object per distinct entity found in the source — one entity in, one entry out; three entities in, three entries out.
- Escape all quotes and newlines properly so JSON.parse succeeds.

EXAMPLE (abbreviated, showing the entities array for a source with users and posts):
{
  "entities": [
    { "name": "user", "models": "...", "routes": "...", "validators": "...", "services": "..." },
    { "name": "post", "models": "...", "routes": "...", "validators": "...", "services": "..." }
  ],
  "summary": "Generated User and Post models with a Post→User authorId reference."
}`;

function buildTextPrompt(source) {
  return `${CORE_PROMPT}\n\nSource:\n${source}`;
}

function buildImagePrompt() {
  return `${CORE_PROMPT}\n\nRead the attached database schema or ERD image carefully. Extract every table, column, data type, constraint, and relationship shown, then generate code following the rules above. Also return a "source" field in the JSON output containing the raw JSON schema extracted from the image, suitable for placing directly into the editor.`;
}

// ------------------------------------------------------------------
// Helper: safe JSON extraction
// ------------------------------------------------------------------
function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function stripMarkdownFences(rawText) {
  return rawText
    .replace(/```(?:\w*\n)?([\s\S]*?)```/g, '$1')
    .replace(/~~~(?:\w*\n)?([\s\S]*?)~~~/g, '$1');
}

function findJsonInText(text) {
  const openings = { '{': '}', '[': ']' };
  const candidateResults = [];

  for (let i = 0; i < text.length; i += 1) {
    const openChar = text[i];
    const closeChar = openings[openChar];
    if (!closeChar) continue;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let j = i; j < text.length; j += 1) {
      const char = text[j];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (char === openChar) {
        depth += 1;
      } else if (char === closeChar) {
        depth -= 1;
      }
      if (depth === 0) {
        const candidate = text.slice(i, j + 1);
        const parsed = tryParseJson(candidate);
        if (parsed !== null) {
          candidateResults.push({ parsed, raw: candidate });
        }
        break;
      }
    }
  }

  if (candidateResults.length === 0) return null;

  const prioritized = candidateResults.find(({ parsed }) =>
    parsed && typeof parsed === 'object' && (
      parsed.entities || parsed.source || parsed.models || parsed.routes || parsed.validators || parsed.services
    )
  );
  if (prioritized) return prioritized.parsed;

  // Fall back to the largest valid JSON candidate.
  candidateResults.sort((a, b) => b.raw.length - a.raw.length);
  return candidateResults[0].parsed;
}

function extractJsonSafe(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const normalized = stripMarkdownFences(rawText).trim();
  const parsedFull = tryParseJson(normalized);
  if (parsedFull !== null) return parsedFull;
  return findJsonInText(normalized);
}

// ------------------------------------------------------------------
// Groq error → ApiError conversion
// ------------------------------------------------------------------
function groqErrorToApiError(errorText, model) {
  let parsed = null;
  try {
    parsed = JSON.parse(errorText);
  } catch {
    /* keep raw text */
  }
  const groqErr = parsed?.error || {};
  const code = groqErr.code || 'groq_error';
  const msg = groqErr.message || errorText;

  // Model availability problems → clear guidance instead of a raw stack trace.
  if (/model_not_found|model_decommissioned|does not exist|no longer supported/i.test(msg)) {
    return new ApiError(
      `Vision model "${model}" is not available on this Groq account (${code}). ` +
        'Groq vision requires a plan/region with Llama 4 Scout vision access, or use a different ' +
        'vision-capable provider (OpenAI gpt-4o, Anthropic Claude, or Google Gemini) with its own API key.',
      {
        statusCode: 400,
        code: 'vision_model_unavailable',
        details: { model, groqCode: code, groqMessage: msg },
      }
    );
  }

  return new ApiError(`Groq request failed: ${msg}`, {
    statusCode: 502,
    code,
    details: {
      model,
      groqCode: code,
      failed_generation: groqErr.failed_generation,
      groqMessage: msg,
    },
  });
}

// ------------------------------------------------------------------
// Generic Groq call (text path)
// ------------------------------------------------------------------
async function callGroq(messages, model, useJsonFormat = true) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new ApiError('GROQ_API_KEY is not configured on the server.', {
      statusCode: 500,
      code: 'missing_api_key',
      details: { provider: 'groq' },
    });
  }

  const body = {
    model,
    messages,
    max_tokens: 4000,
    temperature: 0.2,
  };
  if (useJsonFormat) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Forcing json_object can cause json_validate_failed (esp. for vision).
    // Retry once without it — the parser still extracts the JSON object.
    if (useJsonFormat && /json_validate_failed|response_format|json_object/i.test(errorText)) {
      return callGroq(messages, model, false);
    }
    throw groqErrorToApiError(errorText, model);
  }

  const payload = await response.json();
  const text = payload?.choices?.[0]?.message?.content || '';

  const parsed = extractJsonSafe(text);
  if (!parsed) {
    throw new ApiError('The model returned an empty or non‑JSON response.', {
      statusCode: 502,
      code: 'invalid_json_response',
      details: { model, responseText: text.slice(0, 500) },
    });
  }
  return parsed;
}

// ------------------------------------------------------------------
// Text generation (Groq)
// ------------------------------------------------------------------
async function generateWithGroq(source) {
  const messages = [
    { role: 'system', content: 'You are a senior Node/Express/Mongoose developer generating clean production code.' },
    { role: 'user', content: buildTextPrompt(source) },
  ];
  return callGroq(messages, GROQ_TEXT_MODEL);
}

// ------------------------------------------------------------------
// Vision generation – Gemini (primary)
// ------------------------------------------------------------------
async function generateFromImageWithGemini(imageBase64, mimeType) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_FLASH_MODEL = process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash-lite';
  if (!GEMINI_API_KEY) {
    throw new ApiError(
      'GEMINI_API_KEY is not set, but VISION_PROVIDER=gemini is configured for image generation.',
      { statusCode: 500, code: 'missing_api_key', details: { provider: 'gemini' } }
    );
  }

  // Gemini expects raw base64 (no data: prefix)
  const url = `${GEMINI_API_URL}/${GEMINI_FLASH_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [
      {
        parts: [
          { text: buildImagePrompt() },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
      maxOutputTokens: 8000,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsed = null;
    try {
      parsed = JSON.parse(errorText);
    } catch {
      /* keep raw */
    }
    const gErr = parsed?.error || {};
    throw new ApiError(`Gemini request failed: ${gErr.message || errorText}`, {
      statusCode: 502,
      code: gErr.code || 'gemini_error',
      details: {
        model: GEMINI_FLASH_MODEL,
        geminiCode: gErr.code,
        geminiMessage: gErr.message,
      },
    });
  }

  const payload = await response.json();
  const candidate = payload?.candidates?.[0];
  if (!candidate) {
    throw new ApiError('Gemini returned a response without candidates.', {
      statusCode: 502,
      code: 'no_candidates',
    });
  }

  const candidateContent = candidate?.content;
  if (candidateContent && typeof candidateContent === 'object' && !Array.isArray(candidateContent)) {
    if (
      candidateContent.entities ||
      candidateContent.models ||
      candidateContent.routes ||
      candidateContent.validators ||
      candidateContent.source
    ) {
      return candidateContent;
    }
  }

  const parts = Array.isArray(candidateContent)
    ? candidateContent
    : candidateContent?.parts || [];

  const text = (parts || [])
    .map((part) => (typeof part === 'string' ? part : part?.text || ''))
    .join('')
    .trim();

  // ----------- NEW: robust JSON extraction -------------
  const parsed = extractJsonSafe(text);
  if (!parsed) {
    // If Gemini gave us non‑JSON, fall back to OpenAI if it is configured.
    // This provides a graceful degradation path instead of immediately throwing.
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiVisionModel = process.env.OPENAI_VISION_MODEL || 'gpt-4o';
    if (openaiApiKey) {
      console.warn('Gemini returned non‑JSON, falling back to OpenAI vision model.');
      // Re‑use the OpenAI path (defined later) – we call it directly here.
      return await generateFromImageWithOpenAI(imageBase64, mimeType);
    }

    // If no fallback is possible, throw the original error with more context.
    throw new ApiError('Gemini returned a non‑JSON response.', {
      statusCode: 502,
      code: 'invalid_json_response',
      details: { model: GEMINI_FLASH_MODEL, responseText: text.slice(0, 500) },
    });
  }
  return parsed;
}

// ------------------------------------------------------------------
// Alternative: Vision generation – OpenAI (fallback)
// ------------------------------------------------------------------
async function generateFromImageWithOpenAI(imageBase64, mimeType) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4o';
  if (!OPENAI_API_KEY) {
    throw new ApiError(
      'OPENAI_API_KEY is not set, but VISION_PROVIDER=openai is configured for image generation.',
      { statusCode: 500, code: 'missing_api_key', details: { provider: 'openai' } }
    );
  }

  const url = `${OPENAI_API_URL}/${OPENAI_VISION_MODEL}:generateContent?key=${OPENAI_API_KEY}`;
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const body = {
    model: OPENAI_VISION_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are a senior Node/Express/Mongoose developer generating clean production code from database schema images.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: buildImagePrompt() },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
    max_tokens: 8000,
    temperature: 0.2,
    response_format: { type: 'json_object' },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsed = null;
    try {
      parsed = JSON.parse(errorText);
    } catch {
      /* keep raw */
    }
    const oErr = parsed?.error || {};
    throw new ApiError(`OpenAI request failed: ${oErr.message || errorText}`, {
      statusCode: 502,
      code: oErr.code || 'openai_error',
      details: {
        model: OPENAI_VISION_MODEL,
        openaiCode: oErr.code,
        openaiMessage: oErr.message,
      },
    });
  }

  const payload = await response.json();
  const text = (payload?.choices?.[0]?.message?.content || '')
    .trim();

  const parsed = extractJsonSafe(text);
  if (!parsed) {
    throw new ApiError('OpenAI returned an empty or non‑JSON response.', {
      statusCode: 502,
      code: 'invalid_json_response',
      details: { model: OPENAI_VISION_MODEL, responseText: text.slice(0, 500) },
    });
  }
  return parsed;
}

// ------------------------------------------------------------------
// Gemini → OpenAI fallback wrapper (called from the route)
// ------------------------------------------------------------------
async function generateFromImage(imageBase64, mimeType) {
  const provider = (process.env.VISION_PROVIDER || 'gemini').toLowerCase();

  let modelOutput;
  try {
    if (provider === 'gemini') {
      modelOutput = await generateFromImageWithGemini(imageBase64, mimeType);
    } else if (provider === 'openai') {
      modelOutput = await generateFromImageWithOpenAI(imageBase64, mimeType);
    } else if (provider === 'groq') {
      // Groq does not have a vision‑capable model in this repo, keep for completeness
      throw new ApiError('Groq is not configured for vision generation.', {
        statusCode: 500,
        code: 'vision_not_configured',
      });
    }
  } catch (err) {
    // If any step fails, log and re‑throw so the controller can handle it
    console.error('Image generation failed:', err.message, err.details || {});
    throw err;
  }

  if (modelOutput && Array.isArray(modelOutput.entities) && modelOutput.entities.length > 0) {
    return shapeAiResult(modelOutput, 'ai');
  }

  if (modelOutput && (modelOutput.models || modelOutput.routes || modelOutput.validators || modelOutput.services)) {
    return { ...modelOutput, sourceType: 'ai' };
  }

  throw new ApiError('AI image generation returned an unexpected response shape.', {
    statusCode: 502,
    code: 'invalid_image_output',
    details: { provider, output: modelOutput },
  });
}

// ------------------------------------------------------------------
// Collapsing entities into the final shape
// ------------------------------------------------------------------
function concatenateEntities(entities) {
  const models = (entities || [])
    .map((entity) => entity?.models)
    .filter(Boolean)
    .join('\n\n');
  const routes = (entities || [])
    .map((entity) => entity?.routes)
    .filter(Boolean)
    .join('\n\n');
  const validators = (entities || [])
    .map((entity) => entity?.validators)
    .filter(Boolean)
    .join('\n\n');
  const services = (entities || [])
    .map((entity) => entity?.services)
    .filter(Boolean)
    .join('\n\n');
  return { models, routes, validators, services };
}

function shapeAiResult(modelOutput, sourceType) {
  const { models, routes, validators, services } = concatenateEntities(modelOutput?.entities);
  return {
    models,
    routes,
    validators,
    services,
    summary:
      modelOutput?.summary ||
      'Generated code using AI mapping of legacy schema to Node/Express structures.',
    source: modelOutput?.source || null,
    sourceType,
  };
}

// ------------------------------------------------------------------
// Public entry points
// ------------------------------------------------------------------
async function generateFromSource(source) {
  if (process.env.GROQ_API_KEY) {
    try {
      const modelOutput = await generateWithGroq(source);
      if (Array.isArray(modelOutput?.entities) && modelOutput.entities.length > 0) {
        return shapeAiResult(modelOutput, 'ai');
      }
      console.warn('AI response contained no entities; falling back to local synthesis.');
    } catch (error) {
      console.warn('AI generation failed, falling back to local synthesis:', error.message);
    }
  }

  return {
    ...createFallbackOutput(source),
    sourceType: 'local',
  };
}

// Export
module.exports = {
  generateFromSource,
  generateFromImage,
};