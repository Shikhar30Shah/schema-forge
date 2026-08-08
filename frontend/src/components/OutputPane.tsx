import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';

type OutputPaneProps = {
  models: string;
  routes: string;
  validators: string;
  summary: string;
  services: string;
  status: string;
  error: string | null;
  onCopy: (content: string) => void;
};

export function OutputPane({ models, routes, validators, summary, services, status, error, onCopy }: OutputPaneProps) {
  const [selectedTab, setSelectedTab] = React.useState('models');
  const tabs = [
    { id: 'models', title: 'Models', content: models },
    { id: 'routes', title: 'Routes', content: routes },
    { id: 'validators', title: 'Validators', content: validators },
    { id: 'services', title: 'Services', content: services }, // Placeholder for services tab
  ];

  return (
    <Card className="border-slate-700 bg-slate-900">
      <CardHeader>
        <CardTitle className="text-cyan-300">Generated Output</CardTitle>
        <CardDescription>
          {summary || 'Generate production-ready code snippets for Mongoose, Express routes, and validators.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {status === 'loading' ? (
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-300">Generating AI output…</span>
            ) : (
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-300">Ready</span>
            )}
            {error && <span className="text-sm text-red-400">{error}</span>}
          </div>
          <Button
            onClick={() => onCopy(tabs.find((tab) => tab.id === selectedTab)?.content || '')}
            variant="outline"
            size="sm"
          >
            Copy Current Tab
          </Button>
        </div>

        <div className="flex gap-2 border-b border-slate-700 pb-3">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'border-b-2 border-cyan-500 bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        <pre className="mt-4 overflow-x-auto rounded-lg border border-slate-700 bg-slate-800 p-4 font-mono text-sm text-slate-100">
          {tabs.find((tab) => tab.id === selectedTab)?.content || ''}
        </pre>
      </CardContent>
    </Card>
  );
}

