import { ConnectionList } from '@/components/Sidebar/ConnectionList';
import { TabBar } from '@/components/TabBar/TabBar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { QueryView } from '@/components/Views/QueryView';
import { TableView } from '@/components/Views/TableView';
import { WelcomeView } from '@/components/Views/WelcomeView';
import { useTabStore } from '@/store/tabStore';

export function AppShell() {
  useKeyboardShortcuts();
  const tabs = useTabStore((state) => state.tabs);
  const activeTabId = useTabStore((state) => state.activeTabId);
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="flex w-72 flex-col border-r bg-card/60">
        <div className="border-b px-4 py-3">
          <h1 className="font-semibold text-lg">CaskPG</h1>
          <p className="text-xs text-muted-foreground">PostgreSQL Manager</p>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <ConnectionList />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-muted/20">
        <TabBar />
        <div className="min-h-0 flex-1 overflow-auto">
          {activeTab ? (activeTab.mode === 'query' ? <QueryView tab={activeTab} /> : <TableView tab={activeTab} />) : <WelcomeView />}
        </div>
      </main>
    </div>
  );
}
