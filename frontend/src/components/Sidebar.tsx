import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { X } from 'lucide-react';

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

const NAV = [
  {
    group: 'Workspace',
    items: [
      { path: '', label: 'New Schema' },
      { path: 'history', label: 'History' },
      { path: 'templates', label: 'Templates' },
    ],
  },
  {
    group: 'Tools',
    items: [
      { path: 'visualizer', label: 'Visualizer' },
      { path: 'validator', label: 'Validator' },
      { path: 'settings', label: 'Settings' },
    ],
  },
];

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = router.pathname;
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const isActive = (path: string) => (path === '' ? pathname === '/' : pathname === `/${path}`);

  const handleNavigate = (path: string) => () => {
    router.push(`/${path}`);
    onClose?.();
  };

  const linkClass = (path: string) =>
    `w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
      isActive(path) ? 'bg-[#171f33] text-[#c0c1ff]' : 'text-[#dae2fd] hover:bg-[#171f33]'
    } transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c0c1ff]`;

  // Accessibility: move focus into the drawer when opened; mark inert when closed.
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    drawer.inert = !open;
    if (open) drawer.focus();
  }, [open]);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = event.touches[0].clientX - touchStartX.current;
    // Swipe left past 60px closes the drawer.
    if (deltaX < -60) {
      onClose?.();
      touchStartX.current = null;
    }
  };

  const navContent = (
    <>
      {NAV.map((section) => (
        <div key={section.group} className="mb-8 last:mb-0">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#c7c4d7]">
            {section.group}
          </h3>
          <nav className="space-y-1">
            {section.items.map((item) => (
              <button
                key={item.path}
                className={linkClass(item.path)}
                onClick={handleNavigate(item.path)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      ))}
    </>
  );

  return (
    <>
      {/* Static sidebar on desktop */}
      <aside className="hidden w-60 flex-shrink-0 overflow-y-auto border-r border-[#171f33] bg-[#131b2e] p-6 md:flex md:flex-col">
        {navContent}
      </aside>

      {/* Swipeable drawer on mobile */}
      <div
        id="sidebar-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        aria-hidden={!open}
        tabIndex={-1}
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto border-r border-[#171f33] bg-[#131b2e] p-6 transition-transform duration-300 ease-in-out md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="text-base font-bold text-[#c0c1ff]">SchemaForge</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#dae2fd] transition hover:bg-[#171f33] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c0c1ff]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {navContent}
      </div>
    </>
  );
}
