// Local-synthesis fallback used when the AI service is unavailable or returns no
// usable entities. Produces one Mongoose model / Express router / express-validator
// chain PER entity detected in the source, with proper field types and FKs as
// ObjectId refs. This mirrors the structure the AI path emits so the UI stays
// consistent regardless of which path ran.

// ---------------------------------------------------------------------------
// Naming helpers
// ---------------------------------------------------------------------------

function singularize(word) {
  if (!word) return word;
  const w = String(word).toLowerCase();
  if (/(series|species|news|metadata)$/.test(w)) return word;
  if (/[^aeiou]ies$/.test(w)) return word.slice(0, -3) + 'y';
  if (/ies$/.test(w)) return word.slice(0, -1);
  if (/(ss|us|x|ch|sh)es$/.test(w)) return word.slice(0, -2);
  if (/s$/.test(w) && !/ss$/.test(w)) return word.slice(0, -1);
  return word;
}

function toModelName(entityKey) {
  const words = String(entityKey)
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => singularize(word));

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

// ---------------------------------------------------------------------------
// Type resolution
// ---------------------------------------------------------------------------

// Maps the human-readable type strings used in legacy schema definitions
// (e.g. "integer", "decimal", "timestamp") to Mongoose types.
const TYPE_TOKEN_MAP = {
  integer: 'Number',
  int: 'Number',
  bigint: 'Number',
  number: 'Number',
  numeric: 'Number',
  decimal: 'Number',
  float: 'Number',
  double: 'Number',
  real: 'Number',
  string: 'String',
  varchar: 'String',
  char: 'String',
  text: 'String',
  boolean: 'Boolean',
  bool: 'Boolean',
  timestamp: 'Date',
  datetime: 'Date',
  date: 'Date',
  time: 'String',
  object: 'Schema.Types.Mixed',
  json: 'Schema.Types.Mixed',
  mixed: 'Schema.Types.Mixed',
  array: '[Schema.Types.Mixed]',
};

function mapTypeToken(rawValue) {
  if (typeof rawValue !== 'string') return null;
  const key = rawValue.trim().toLowerCase();
  return TYPE_TOKEN_MAP[key] || null;
}

// Infers a Mongoose type from an actual sample value (not a type string).
function detectTypeFromValue(value) {
  if (value === null || value === undefined) return 'Schema.Types.Mixed';
  if (Array.isArray(value)) return '[Schema.Types.Mixed]';
  if (typeof value === 'boolean') return 'Boolean';
  if (typeof value === 'number') return 'Number';
  if (typeof value === 'string') return 'String';
  if (typeof value === 'object') return 'Schema.Types.Mixed';
  return 'Schema.Types.Mixed';
}

// Resolve a field's Mongoose type: prefer an explicit type string if the value
// looks like one, otherwise infer from the value.
function resolveFieldType(rawValue) {
  const tokenType = mapTypeToken(rawValue);
  if (tokenType) return tokenType;
  return detectTypeFromValue(rawValue);
}

// Detect whether a field name is a foreign key referencing another entity.
// Returns the referenced model name (PascalCase) or null.
function detectRef(fieldName, entityKeys) {
  const match = fieldName.match(/^(.+?)[_]?id$/i);
  if (!match) return null;
  const base = singularize(match[1]);
  const referenced = entityKeys.find(
    (key) => singularize(key).toLowerCase() === base.toLowerCase()
  );
  return referenced ? toModelName(referenced) : null;
}

// ---------------------------------------------------------------------------
// Source parsing -> entities
// ---------------------------------------------------------------------------

// Pull the distinct entities out of the source. Supports:
//   1. A "schema definition" object: { entity: { field: typeString, ... }, ... }
//   2. A "sample records" object:    { entity: [ { field: value, ... }, ... ] }
//   3. A single field map treated as one entity (legacy behaviour).
function parseEntities(source) {
  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    return null;
  }

  if (parsed === null || typeof parsed !== 'object') return null;

  const entries = [];
  for (const [key, value] of Object.entries(parsed)) {
    if (Array.isArray(value)) {
      const sample = value[0];
      entries.push({
        key,
        fields: sample && typeof sample === 'object' && !Array.isArray(sample) ? sample : {},
      });
    } else if (value && typeof value === 'object') {
      entries.push({ key, fields: value });
    }
    // top-level scalar values are ignored (belong to a single-entity field map)
  }

  if (entries.length > 0) return entries;

  const allScalars = Object.values(parsed).every(
    (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null
  );
  if (allScalars) {
    return [{ key: 'LegacyRecord', fields: parsed }];
  }

  return null;
}

// ---------------------------------------------------------------------------
// Code builders (one per entity)
// ---------------------------------------------------------------------------

function buildMongooseSchema(modelName, fields, entityKeys) {
  const lines = Object.entries(fields).map(([fieldName, rawValue]) => {
    const ref = detectRef(fieldName, entityKeys);
    if (ref) {
      return `  ${fieldName}: { type: Schema.Types.ObjectId, ref: '${ref}', required: true }`;
    }
    const type = resolveFieldType(rawValue);
    const required = rawValue === null || rawValue === undefined ? 'false' : 'true';
    return `  ${fieldName}: { type: ${type}, required: ${required} }`;
  });

  return `const mongoose = require('mongoose');
const { Schema } = mongoose;

const ${modelName}Schema = new Schema({
${lines.join(',\n')}
}, { timestamps: true });

const ${modelName} = mongoose.model('${modelName}', ${modelName}Schema);
module.exports = ${modelName};
`;
}

function buildExpressRoute(modelName, entityKey) {
  const base = entityKey.toLowerCase();

  return `const express = require('express');
const router = express.Router();
const ${modelName} = require('../models/${modelName}');

router.get('/${base}', async (req, res, next) => {
  try {
    const items = await ${modelName}.find();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get('/${base}/:id', async (req, res, next) => {
  try {
    const item = await ${modelName}.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: '${modelName} not found' });
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.post('/${base}', async (req, res, next) => {
  try {
    const created = await ${modelName}.create(req.body);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.put('/${base}/:id', async (req, res, next) => {
  try {
    const updated = await ${modelName}.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ error: '${modelName} not found' });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/${base}/:id', async (req, res, next) => {
  try {
    const deleted = await ${modelName}.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: '${modelName} not found' });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
`;
}

function buildValidator(modelName, fields) {
  const chains = Object.keys(fields)
    .map(
      (key) => `  body('${key}')
    .exists().withMessage('${key} is required')
    .bail(),`
    )
    .join('\n');

  return `const { body } = require('express-validator');

const ${modelName}Validator = [
${chains}
];

module.exports = ${modelName}Validator;
`;
}

function buildSummary(entities) {
  const names = entities.map((entity) => toModelName(entity.key)).join(', ');
  const count = entities.length;
  return `Detected ${count} entit${count === 1 ? 'y' : 'ies'}: ${names}. Generated a Mongoose model, full CRUD Express routes, and an express-validator chain for each, with foreign keys mapped to ObjectId references.`;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

function createFallbackOutput(source) {
  const entities = parseEntities(source);

  if (!entities) {
    return {
      models: '// Unable to infer schema from raw input. Provide valid JSON or legacy schema text.',
      routes: '// Unable to infer routes from raw input. Provide valid JSON or legacy schema text.',
      validators: '// Unable to infer validators from raw input. Provide valid JSON or legacy schema text.',
      summary: 'Could not parse the source into a schema. Please provide a valid JSON schema or sample objects.',
    };
  }

  const entityKeys = entities.map((entity) => entity.key);
  const models = entities.map((entity) => buildMongooseSchema(toModelName(entity.key), entity.fields, entityKeys)).join('\n\n');
  const routes = entities.map((entity) => buildExpressRoute(toModelName(entity.key), entity.key)).join('\n\n');
  const validators = entities.map((entity) => buildValidator(toModelName(entity.key), entity.fields)).join('\n\n');

  return {
    models,
    routes,
    validators,
    summary: buildSummary(entities),
  };
}

module.exports = {
  singularize,
  toModelName,
  resolveFieldType,
  detectRef,
  parseEntities,
  buildMongooseSchema,
  buildExpressRoute,
  buildValidator,
  buildSummary,
  createFallbackOutput,
};
