import { useState } from 'react';
import type { NextPage } from 'next';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Seo } from '../components/Seo';
import { parseSchema } from '@/lib/parseSchema';
import { CheckCircle, AlertCircle } from 'lucide-react';

const ValidatorPage: NextPage = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{
    valid: boolean;
    entities: number;
    fields: number;
    error?: string;
  } | null>(null);

  const validate = () => {
    if (!input.trim()) {
      setResult({ valid: false, entities: 0, fields: 0, error: 'Enter a schema to validate.' });
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch (err) {
      setResult({
        valid: false,
        entities: 0,
        fields: 0,
        error: `Invalid JSON: ${(err as Error).message}`,
      });
      return;
    }

    const entities = parseSchema(input);
    if (!entities || entities.length === 0) {
      setResult({
        valid: false,
        entities: 0,
        fields: 0,
        error: 'JSON is valid but no schema entities (objects/tables) were detected.',
      });
      return;
    }

    const fieldCount = entities.reduce((sum, e) => sum + e.fields.length, 0);
    setResult({ valid: true, entities: entities.length, fields: fieldCount });
  };

  return (
    <DashboardLayout>
      <Seo
        title="Schema Validator"
        description="Validate a legacy schema or JSON before generating code with SchemaForge."
        noindex
      />
      <h1 className="text-xl font-bold text-[#c0c1ff] mb-1">Schema Validator</h1>
      <p className="text-sm text-[#c7c4d7] mb-6">
        Check that your raw schema or JSON is well-formed and will produce entities before
        generating code.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#dae2fd] mb-2">
            Source schema / JSON
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{ "users": { "id": "integer", "name": "string" } }'
            className="w-full h-80 p-4 bg-[#171f33] text-[#dae2fd] font-mono text-sm border border-[#222a3d] rounded-lg outline-none focus:border-[#c0c1ff] resize-none placeholder-[#464554]"
          />
          <button
            type="button"
            onClick={validate}
            className="mt-3 px-4 py-2 rounded-md bg-[#c0c1ff] text-[#1000a9] text-sm font-semibold hover:bg-[#8083ff] transition-colors"
          >
            Validate
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#dae2fd] mb-2">Result</label>
          <div className="w-full h-80 p-4 bg-[#131b2e] border border-[#171f33] rounded-lg overflow-auto">
            {result === null ? (
              <p className="text-xs text-[#c7c4d7]">
                Results will appear here after validation.
              </p>
            ) : result.valid ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#7bd0ff]">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-semibold">Schema is valid</span>
                </div>
                <div className="text-sm text-[#dae2fd]">
                  Detected{' '}
                  <span className="font-semibold text-[#c0c1ff]">{result.entities}</span>{' '}
                  entit{result.entities === 1 ? 'y' : 'ies'} with{' '}
                  <span className="font-semibold text-[#c0c1ff]">{result.fields}</span> total field
                  {result.fields === 1 ? '' : 's'}.
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-[#ffb4ab]">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <span className="text-sm">{result.error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ValidatorPage;