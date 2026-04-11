import { Plus, Table2 } from 'lucide-react';
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
    return (
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Table2 className="size-3.5" />
          <span>No open tabs yet.</span>
        </div>
        <Button variant="outline" size="sm" onClick={openQueryTab}>
          <Plus data-icon="inline-start" />
          New Query
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
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

      <Button variant="outline" size="sm" onClick={openQueryTab}>
        <Plus data-icon="inline-start" />
        New Query
      </Button>
    </div>
  );
}
