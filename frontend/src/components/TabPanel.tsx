type TabPanelProps = {
  tabs: { id: string; title: string; content: string }[];
  selectedTab: string;
  onSelect: (tabId: string) => void;
};

export function TabPanel({ tabs, selectedTab, onSelect }: TabPanelProps) {
  return (
    <div className="tab-panel">
      <div className="tab-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={tab.id === selectedTab ? 'tab active' : 'tab'}
            onClick={() => onSelect(tab.id)}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="tab-content">
        <pre>{tabs.find((tab) => tab.id === selectedTab)?.content || ''}</pre>
      </div>
    </div>
  );
}
