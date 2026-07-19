import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';

type EditorPaneProps = {
  source: string;
  onChange: (value: string) => void;
};

export function EditorPane({ source, onChange }: EditorPaneProps) {
  return (
    <Card className="border-slate-700 bg-slate-900">
      <CardHeader>
        <CardTitle className="text-cyan-300">Legacy Source</CardTitle>
        <CardDescription>Paste legacy database schema or raw JSON objects here.</CardDescription>
      </CardHeader>
      <CardContent>
        <textarea
          value={source}
          onChange={(event) => onChange(event.target.value)}
          rows={24}
          spellCheck={false}
          aria-label="Source input"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 p-4 font-mono text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
        />
      </CardContent>
    </Card>
  );
}

