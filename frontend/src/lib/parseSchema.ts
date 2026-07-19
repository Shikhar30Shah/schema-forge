// Client-side mirror of the backend schema parser (utils/generator.js).
// Turns the raw source JSON into a structured list of entities + fields so the
// visualizer can render an ER diagram. Kept dependency-free and lightweight.

const TYPE_TOKEN_MAP: Record<string, string> = {
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

function singularize(word: string): string {
  if (!word) return word;
  const w = String(word).toLowerCase();
  if (/(series|species|news|metadata)$/.test(w)) return word;
  if (/[^aeiou]ies$/.test(w)) return word.slice(0, -3) + 'y';
  if (/ies$/.test(w)) return word.slice(0, -1);
  if (/(ss|us|x|ch|sh)es$/.test(w)) return word.slice(0, -2);
  if (/s$/.test(w) && !/ss$/.test(w)) return word.slice(0, -1);
  return word;
}

export function toModelName(entityKey: string): string {
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

function mapTypeToken(rawValue: unknown): string | null {
  if (typeof rawValue !== 'string') return null;
  const key = rawValue.trim().toLowerCase();
  return TYPE_TOKEN_MAP[key] || null;
}

function detectTypeFromValue(value: unknown): string {
  if (value === null || value === undefined) return 'Schema.Types.Mixed';
  if (Array.isArray(value)) return '[Schema.Types.Mixed]';
  if (typeof value === 'boolean') return 'Boolean';
  if (typeof value === 'number') return 'Number';
  if (typeof value === 'string') return 'String';
  if (typeof value === 'object') return 'Schema.Types.Mixed';
  return 'Schema.Types.Mixed';
}

function resolveFieldType(rawValue: unknown): string {
  const tokenType = mapTypeToken(rawValue);
  if (tokenType) return tokenType;
  return detectTypeFromValue(rawValue);
}

function detectRef(fieldName: string, entityKeys: string[]): string | null {
  const match = fieldName.match(/^(.+?)[_]?id$/i);
  if (!match) return null;
  const base = singularize(match[1]);
  const referenced = entityKeys.find(
    (key) => singularize(key).toLowerCase() === base.toLowerCase(),
  );
  return referenced || null;
}

export interface ParsedField {
  name: string;
  type: string;
  ref?: string;
}

export interface ParsedEntity {
  key: string;
  name: string;
  fields: ParsedField[];
}

export function parseSchema(source: string): ParsedEntity[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    return null;
  }

  if (parsed === null || typeof parsed !== 'object') return null;

  const entries: { key: string; fields: Record<string, unknown> }[] = [];
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      const sample = value[0];
      entries.push({
        key,
        fields:
          sample && typeof sample === 'object' && !Array.isArray(sample)
            ? (sample as Record<string, unknown>)
            : {},
      });
    } else if (value && typeof value === 'object') {
      entries.push({ key, fields: value as Record<string, unknown> });
    }
  }

  if (entries.length > 0) {
    const entityKeys = entries.map((e) => e.key);
    return entries.map((entry) => ({
      key: entry.key,
      name: toModelName(entry.key),
      fields: Object.entries(entry.fields).map(([name, raw]) => {
        const ref = detectRef(name, entityKeys) || undefined;
        return { name, type: resolveFieldType(raw), ref };
      }),
    }));
  }

  const allScalars = Object.values(parsed as Record<string, unknown>).every(
    (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null,
  );
  if (allScalars) {
    return [
      {
        key: 'LegacyRecord',
        name: 'LegacyRecord',
        fields: Object.entries(parsed as Record<string, unknown>).map(([name, raw]) => ({
          name,
          type: resolveFieldType(raw),
        })),
      },
    ];
  }

  return null;
}
