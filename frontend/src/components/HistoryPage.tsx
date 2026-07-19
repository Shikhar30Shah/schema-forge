'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { type HistoryEntry } from '@/lib/api';
import { bootstrapAuth } from '../features/auth/authSlice';
import { loadHistory } from '../features/history/historySlice';
import { setPendingEntry } from '../features/generation/generationSlice';
import type { AppDispatch, RootState } from '../store/store';

export function HistoryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { entries, loading, error } = useSelector((state: RootState) => state.history);

  useEffect(() => {
    void dispatch(bootstrapAuth());
  }, [dispatch]);

  useEffect(() => {
    if (token) {
      void dispatch(loadHistory({ token }));
    }
  }, [token, dispatch]);

  const openInWorkspace = (entry: HistoryEntry) => {
    dispatch(setPendingEntry(entry));
    router.push('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-dashed border-[#222a3d] p-8 text-center">
        <p className="text-sm text-[#dae2fd]">Sign in to view your generation history.</p>
        <button
          onClick={() => router.push('/signin')}
          className="mt-4 rounded-md bg-[#c0c1ff] px-4 py-2 text-sm font-semibold text-[#1000a9] transition hover:bg-[#8083ff]"
        >
          Sign in
        </button>
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-[#c7c4d7]">Loading history…</p>;
  }

  if (error) {
    return <p className="text-sm text-[#ffb4ab]">{error}</p>;
  }

  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[#222a3d] p-8 text-center text-sm text-[#c7c4d7]">
        No saved runs yet. Generate a schema and it will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <HistoryCard key={entry.id} entry={entry} onOpen={() => openInWorkspace(entry)} />
      ))}
    </div>
  );
}

function HistoryCard({ entry, onOpen }: { entry: HistoryEntry; onOpen: () => void }) {
  return (
    <div className="rounded-lg border border-[#171f33] bg-[#131b2e] p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#dae2fd]">{entry.summary || 'Saved generation'}</p>
          <p className="mt-1 text-xs text-[#c7c4d7]">{new Date(entry.createdAt).toLocaleString()}</p>
        </div>
        <button
          onClick={onOpen}
          className="shrink-0 rounded-md bg-[#c0c1ff] px-3 py-1.5 text-xs font-semibold text-[#1000a9] transition hover:bg-[#8083ff]"
        >
          Open in Workspace
        </button>
      </div>

      {entry.source && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#c7c4d7]">Source</p>
          <pre className="max-h-32 overflow-auto rounded-md bg-[#171f33] p-3 text-xs text-[#dae2fd]">{entry.source}</pre>
        </div>
      )}

      <div className="grid gap-3">
        <CodeBlock label="Models" code={entry.models} />
        <CodeBlock label="Routes" code={entry.routes} />
        <CodeBlock label="Validators" code={entry.validators} />
      </div>
    </div>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  if (!code) {
    return null;
  }
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#c7c4d7]">{label}</p>
      <pre className="overflow-auto rounded-md bg-[#171f33] p-3 text-xs leading-6 text-[#dae2fd]">{code}</pre>
    </div>
  );
}
