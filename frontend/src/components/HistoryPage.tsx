'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { type HistoryEntry } from '@/lib/api';
import { loadHistory } from '../features/history/historySlice';
import { setPendingEntry } from '../features/generation/generationSlice';
import type { AppDispatch, RootState } from '../store/store';

export function HistoryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { entries, loading, error } = useSelector((state: RootState) => state.history);
  const [currentIndex, setCurrentIndex] = useState(0);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [entries],
  );

  useEffect(() => {
    if (token) {
      void dispatch(loadHistory({ token }));
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (sortedEntries.length > 0) {
      setCurrentIndex(0);
    }
  }, [sortedEntries.length]);

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

  if (sortedEntries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[#222a3d] p-8 text-center text-sm text-[#c7c4d7]">
        No saved runs yet. Generate a schema and it will appear here.
      </p>
    );
  }

  const currentEntry = sortedEntries[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === sortedEntries.length - 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-lg border border-[#171f33] bg-[#131b2e] p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mt-1 text-xs text-[#c7c4d7]">Showing {currentIndex + 1} of {sortedEntries.length} saved runs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={isFirst}
            onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
            className="inline-flex items-center gap-2 rounded-md border border-[#222a3d] bg-[#0f172c] px-3 py-2 text-sm font-medium text-[#dae2fd] transition hover:border-[#c0c1ff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>
          <button
            disabled={isLast}
            onClick={() => setCurrentIndex((index) => Math.min(index + 1, sortedEntries.length - 1))}
            className="inline-flex items-center gap-2 rounded-md border border-[#222a3d] bg-[#0f172c] px-3 py-2 text-sm font-medium text-[#dae2fd] transition hover:border-[#c0c1ff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <CurrentHistoryCard entry={currentEntry} onOpen={() => openInWorkspace(currentEntry)} />
    </div>
  );
}

function CurrentHistoryCard({ entry, onOpen }: { entry: HistoryEntry; onOpen: () => void }) {
  return (
    <div className="rounded-lg border border-[#171f33] bg-[#131b2e] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#dae2fd]">{entry.summary || 'Saved generation'}</p>
          <p className="mt-1 text-xs text-[#c7c4d7]">{new Date(entry.createdAt).toLocaleString()}</p>
        </div>
        <button
          onClick={onOpen}
          className="rounded-md bg-[#c0c1ff] px-4 py-2 text-sm font-semibold text-[#1000a9] transition hover:bg-[#8083ff]"
        >
          Open in Workspace
        </button>
      </div>

      {entry.source && (
        <div className="mb-4 rounded-lg border border-[#222a3d] bg-[#0f172c] p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#c7c4d7]">Source</p>
          <pre className="max-h-48 overflow-auto rounded-md bg-[#131b2e] p-3 text-xs text-[#dae2fd]">{entry.source}</pre>
        </div>
      )}

      <div className="grid gap-4">
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
