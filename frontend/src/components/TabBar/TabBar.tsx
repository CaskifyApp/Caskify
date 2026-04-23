import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTabStore } from '@/store/tabStore';

import { TabItem } from '@/components/TabBar/TabItem';

export function TabBar() {
  const tabs = useTabStore((state) => state.tabs);
  const activeTabId = useTabStore((state) => state.activeTabId);
  const setActiveTab = useTabStore((state) => state.setActiveTab);
  const closeTab = useTabStore((state) => state.closeTab);
  const openQueryTab = useTabStore((state) => state.openQueryTab);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-0 border-b border-border/30 bg-muted/5">
      <div className="flex min-w-0 flex-1 items-end overflow-x-auto">
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

      <div className="flex shrink-0 items-center border-l border-border/20 px-2 py-1.5">
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={openQueryTab}>
          <Plus className="size-3" />
          <span className="hidden sm:inline">New Query</span>
        </Button>
      </div>
    </div>
  );
}