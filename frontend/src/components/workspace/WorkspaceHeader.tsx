import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import type { AuthUser } from '@/lib/api';

type WorkspaceHeaderProps = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  onLogout: () => void;
};

export function WorkspaceHeader({ user, isAuthenticated, onLogout }: WorkspaceHeaderProps) {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#131b2e] border-b border-[#171f33] flex items-center px-8 z-50 gap-6">
      <h1 className="text-xl font-bold text-[#c0c1ff]">SchemaForge</h1>
      <p className="text-sm font-medium text-[#dae2fd]">AI-Powered Database Migration &amp; API Route Generator</p>
      <div className="flex-1" />
      {!isAuthenticated ? (
        <>
          <button
            onClick={() => router.push('/signin')}
            className="rounded-md border border-[#222a3d] px-4 py-2 text-sm font-medium text-[#dae2fd] transition hover:border-[#c0c1ff] hover:text-[#c0c1ff]"
          >
            Sign in
          </button>
          <button
            onClick={() => router.push('/signup')}
            className="rounded-md bg-[#c0c1ff] px-4 py-2 text-sm font-semibold text-[#1000a9] transition hover:bg-[#8083ff]"
          >
            Sign up
          </button>
        </>
      ) : (
        <>
          <div className="rounded-full border border-[#222a3d] px-3 py-1 text-sm text-[#c7c4d7]">
            {user?.name || 'Signed in'}
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-md border border-[#222a3d] px-4 py-2 text-sm font-medium text-[#dae2fd] transition hover:border-[#ffb4ab] hover:text-[#ffb4ab]"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </>
      )}
    </header>
  );
}
