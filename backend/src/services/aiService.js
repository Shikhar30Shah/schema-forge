const { createFallbackOutput } = require('../utils/generator');
const { ApiError } = require('../middleware/errorHandler');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Text model used for the schema/JSON -> code path.
const GROQ_TEXT_MODEL = process.env.GROQ_TEXT_MODEL || 'llama-3.3-70b-versatile';

// Vision model used for the image -> code path. Must be a Groq model that
// accepts image_url content. llama-3.2-* vision previews are decommissioned and
// this account's available models may not include a vision model at all, so this
// is overridable via GROQ_VISION_MODEL (or switch providers with VISION_PROVIDER).
const GROQ_VISION_MODEL =
  process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-19b-17b-vision-preview';

// Core generation instructions shared by both the text and image paths.
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

OUTPUT FORMAT:
Return ONLY a single valid JSON object, no markdown fences, no prose outside it, matching exactly this shape:
{
  "entities": [
    {
      "name": "<entity name, e.g. 'user'>",
      "models": "<full model file as a string, \\n for newlines>",
      "routes": "<full router file as a string>",
      "validators": "<full validator file as a string>"
    }
  ],
  "summary": "<2-3 sentences covering all entities generated and any relationships detected>"
}
- "entities" must have exactly one object per distinct entity found in the source — one entity in, one entry out; three entities in, three entries out.
- Escape all quotes and newlines properly so JSON.parse succeeds.

EXAMPLE (abbreviated, showing the entities array for a source with users and posts):
{
  "entities": [
    { "name": "user", "models": "...", "routes": "...", "validators": "..." },
    { "name": "post", "models": "...", "routes": "...", "validators": "..." }
  ],
  "summary": "Generated User and Post models with a Post→User authorId reference."
}`;

function buildTextPrompt(source) {
  return `${CORE_PROMPT}\n\nSource:\n${source}`;
}

function buildImagePrompt() {
  return `${CORE_PROMPT}\n\nRead the attached database schema or ERD image carefully. Extract every table, column, data type, constraint, and relationship shown, then generate code following the rules above.`;
}

// Pull the first balanced {...} object out of free-form model text (also strips
// ```json fences). Returns the parsed object, or null if none / unparseable.
function extractJson(text) {
  if (!text || !text.trim()) return null;
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    try {
      return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    } catch {
      return null;
    }
  }
  return null;
}

// Map a raw Groq error body into a structured, actionable ApiError.
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

  // Model availability problems -> clear guidance instead of a raw stack trace.
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
    model, // <-- the actual model (previously hardcoded, so the vision path used a text model)
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

  const parsed = extractJson(text);
  if (!parsed) {
    throw new ApiError(
      'The model returned an empty or non-JSON response. If you sent an image, the configured model likely cannot read images.',
      {
        statusCode: 502,
        code: 'invalid_json_response',
        details: { model, responseText: text.slice(0, 500) },
      }
    );
  }
  return parsed;
}

async function generateWithGroq(source) {
  const messages = [
    { role: 'system', content: 'You are a senior Node/Express/Mongoose developer generating clean production code.' },
    { role: 'user', content: buildTextPrompt(source) },
  ];
  return callGroq(messages, GROQ_TEXT_MODEL);
}

// Groq image path.
async function generateFromImageWithGroq(imageBase64, mimeType) {
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;
  const messages = [
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
  ];
  return callGroq(messages, GROQ_VISION_MODEL);
}

// Optional alternative provider (set VISION_PROVIDER=openai and OPENAI_API_KEY).
async function generateFromImageWithOpenAI(imageBase64, mimeType) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4o';
  if (!OPENAI_API_KEY) {
    throw new ApiError(
      'OPENAI_API_KEY is not set, but VISION_PROVIDER=openai is configured for image generation.',
      { statusCode: 500, code: 'missing_api_key', details: { provider: 'openai' } }
    );
  }

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

  const response = await fetch(OPENAI_API_URL, {
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
      details: { model: OPENAI_VISION_MODEL, openaiCode: oErr.code, openaiMessage: oErr.message },
    });
  }

  const payload = await response.json();
  const text = payload?.choices?.[0]?.message?.content || '';
  const parsed = extractJson(text);
  if (!parsed) {
    throw new ApiError('OpenAI returned an empty or non-JSON response.', {
      statusCode: 502,
      code: 'invalid_json_response',
      details: { model: OPENAI_VISION_MODEL, responseText: text.slice(0, 500) },
    });
  }
  return parsed;
}

// Optional Gemini provider (set VISION_PROVIDER=gemini and GEMINI_API_KEY).
async function generateFromImageWithGemini(imageBase64, mimeType) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_FLASH_MODEL = process.env.GEMINI_FLASH_MODEL || 'gemini-1.5-flash';
  if (!GEMINI_API_KEY) {
    throw new ApiError(
      'GEMINI_API_KEY is not set, but VISION_PROVIDER=gemini is configured for image generation.',
      { statusCode: 500, code: 'missing_api_key', details: { provider: 'gemini' } }
    );
  }

  // Gemini takes raw base64 (no data: prefix) and returns JSON when
  // responseMimeType is set to application/json.
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
      code: gErr.status || 'gemini_error',
      details: { model: GEMINI_FLASH_MODEL, geminiCode: gErr.code, geminiMessage: gErr.message },
    });
  }

  const payload = await response.json();
  const candidate = payload?.candidates?.[0];
  const text = (candidate?.content?.parts || [])
    .map((part) => part.text || '')
    .join('')
    .trim();

  if (!text || candidate?.finishReason === 'SAFETY') {
    throw new ApiError(
      'Gemini returned an empty or blocked response (possibly a safety filter).',
      {
        statusCode: 502,
        code: 'invalid_json_response',
        details: { model: GEMINI_FLASH_MODEL, finishReason: candidate?.finishReason },
      }
    );
  }

  const parsed = extractJson(text);
  if (!parsed) {
    throw new ApiError('Gemini returned a non-JSON response.', {
      statusCode: 502,
      code: 'invalid_json_response',
      details: { model: GEMINI_FLASH_MODEL, responseText: text.slice(0, 500) },
    });
  }
  return parsed;
}

async function generateFromImage(imageBase64, mimeType) {
  const provider = (process.env.VISION_PROVIDER || 'gemini').toLowerCase();

  let modelOutput;
  if (provider === 'openai') {
    modelOutput = await generateFromImageWithOpenAI(imageBase64, mimeType);
  } else if (provider === 'gemini') {
    modelOutput = await generateFromImageWithGemini(imageBase64, mimeType);
  } else {
    modelOutput = await generateFromImageWithGroq(imageBase64, mimeType);
  }

  if (Array.isArray(modelOutput?.entities) && modelOutput.entities.length > 0) {
    return shapeAiResult(modelOutput, 'ai-image');
  }

  throw new ApiError('Image generation did not return a valid entities array.', {
    statusCode: 422,
    code: 'no_entities',
    details: { modelOutput },
  });
}

// Collapse the per-entity AI output into the flat { models, routes, validators }
// strings the API contract expects. Each entity contributes its own file block.
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
  return { models, routes, validators };
}

function shapeAiResult(modelOutput, sourceType) {
  const { models, routes, validators } = concatenateEntities(modelOutput?.entities);
  return {
    models,
    routes,
    validators,
    summary:
      modelOutput?.summary ||
      'Generated code using AI mapping of legacy schema to Node/Express structures.',
    sourceType,
  };
}

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

module.exports = {
  generateFromSource,
  generateFromImage,
};
