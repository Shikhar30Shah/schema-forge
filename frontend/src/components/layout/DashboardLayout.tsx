'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { LogOut, Menu } from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { bootstrapAuth, logoutUser } from '@/features/auth/authSlice';
import type { AppDispatch, RootState } from '@/store/store';

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Centralize auth bootstrap so every protected page has a valid session/token.
  useEffect(() => {
    void dispatch(bootstrapAuth());
  }, [dispatch]);

  // Close the mobile drawer with Escape.
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  const handleLogout = () => {
    void dispatch(logoutUser(token));
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-[#0b1326] text-[#dae2fd]">
      <header className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-[#171f33] bg-[#131b2e] px-4 md:h-16 md:px-8">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={sidebarOpen}
          aria-controls="sidebar-drawer"
          className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-[#dae2fd] transition hover:bg-[#171f33] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c0c1ff] md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-lg font-bold text-[#c0c1ff] md:text-xl">SchemaForge</h1>
        {/* Long descriptor hidden on small screens to avoid crowding the header. */}
        <p className="hidden text-sm font-medium text-[#dae2fd] md:block">
          AI-Powered Database Migration &amp; API Route Generator
        </p>

        <div className="flex-1" />

        {!isAuthenticated ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/signin')}
              className="rounded-md border border-[#222a3d] px-3 py-1.5 text-sm font-medium text-[#dae2fd] transition hover:border-[#c0c1ff] hover:text-[#c0c1ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c0c1ff]"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="rounded-md bg-[#c0c1ff] px-3 py-1.5 text-sm font-semibold text-[#1000a9] transition hover:bg-[#8083ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1000a9]"
            >
              Sign up
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-[#222a3d] px-3 py-1 text-sm text-[#c7c4d7] sm:inline-flex">
              {user?.name || 'Signed in'}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              className="inline-flex items-center gap-2 rounded-md border border-[#222a3d] px-3 py-1.5 text-sm font-medium text-[#dae2fd] transition hover:border-[#ffb4ab] hover:text-[#ffb4ab] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c0c1ff]"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      {/* Mobile scrim behind the drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
