import { AlertCircle, CheckCircle, Copy, Loader } from 'lucide-react';

type OutputTab = {
  id: string;
  label: string;
  content: string;
};

type OutputPanelProps = {
  tabs: OutputTab[];
  selectedTab: string;
  status: string;
  currentTabContent: string;
  onSelectTab: (tabId: string) => void;
  onCopy: () => void;
};

export function OutputPanel({
  tabs,
  selectedTab,
  status,
  currentTabContent,
  onSelectTab,
  onCopy,
}: OutputPanelProps) {
  return (
    <div className="flex min-h-[70vh] flex-col bg-[#131b2e] border border-[#171f33] rounded-lg overflow-hidden lg:min-h-0 lg:h-full lg:flex-1">
      <div className="bg-[#171f33] border-b border-[#222a3d] p-4">
        <h2 className="text-base font-semibold text-[#c0c1ff] mb-1">Generated Output</h2>
        <p className="hidden text-xs text-[#c7c4d7] sm:block">Production-ready code snippets for Mongoose, Express routes, and validators.</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#171f33] bg-[#131b2e]">
        <div className="flex items-center gap-3">
          {status === 'ready' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#7bd0ff]/10 rounded-full">
              <CheckCircle className="w-4 h-4 text-[#7bd0ff]" />
              <span className="text-xs font-medium text-[#7bd0ff]">Ready</span>
            </div>
          )}
          {status === 'loading' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#c0c1ff]/10 rounded-full">
              <Loader className="w-4 h-4 text-[#c0c1ff] animate-spin" />
              <span className="text-xs font-medium text-[#c0c1ff]">Generating…</span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#ffb4ab]/10 rounded-full">
              <AlertCircle className="w-4 h-4 text-[#ffb4ab]" />
              <span className="text-xs font-medium text-[#ffb4ab]">Error</span>
            </div>
          )}
        </div>
        <button
          onClick={onCopy}
          className="flex items-center gap-2 px-3 py-1 bg-transparent border border-[#464554] text-[#dae2fd] rounded-md hover:border-[#c0c1ff] hover:text-[#c0c1ff] transition-colors text-xs font-medium"
        >
          <Copy className="w-4 h-4" />
          Copy Tab
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#171f33]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              selectedTab === tab.id
                ? 'text-[#c0c1ff] border-[#c0c1ff]'
                : 'text-[#c7c4d7] border-transparent hover:text-[#dae2fd]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code Display */}
      <pre className="flex-1 overflow-auto p-4 bg-[#171f33] text-[#dae2fd] font-mono text-xs leading-6">
        {typeof currentTabContent === 'string' ? (
          currentTabContent
        ) : (
          Object.keys(currentTabContent).map((key) => (
            <div key={key}>
              <h3 className="text-sm font-semibold text-[#c0c1ff] mb-2">{key}</h3>
              <pre className="mb-4 p-3 bg-[#222a3d] rounded-md text-[#dae2fd]">
                {typeof currentTabContent[key] === 'string'
                  ? currentTabContent[key]
                  : JSON.stringify(currentTabContent[key], null, 2)}
              </pre>
            </div>
          ))
        )}
      </pre>
    </div>
  );
}
