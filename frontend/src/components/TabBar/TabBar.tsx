import { Table2 } from 'lucide-react';
import { useTabStore } from '@/store/tabStore';
import { TabItem } from '@/components/TabBar/TabItem';

export function TabBar() {
  const tabs = useTabStore((state) => state.tabs);
  const activeTabId = useTabStore((state) => state.activeTabId);
  const setActiveTab = useTabStore((state) => state.setActiveTab);
  const closeTab = useTabStore((state) => state.closeTab);

  if (tabs.length === 0) {
    return (
      <div className="flex items-center gap-2 border-b px-4 py-3 text-xs text-muted-foreground">
        <Table2 className="size-3.5" />
        <span>No open tables yet.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b px-3 py-2">
      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          active={tab.id === activeTabId}
          onSelect={setActiveTab}
          onClose={closeTab}
        />
      ))}
    </div>
  );
}
