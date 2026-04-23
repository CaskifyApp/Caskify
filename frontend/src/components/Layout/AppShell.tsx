import { Suspense, lazy, useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { ConnectionList } from '@/components/Sidebar/ConnectionList';
import { TabBar } from '@/components/TabBar/TabBar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Spinner } from '@/components/ui/spinner';
import { WelcomeView } from '@/components/Views/WelcomeView';
import { SetupWizard } from '@/components/Views/SetupWizard';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/store/settingsStore';
import { useTabStore } from '@/store/tabStore';
import { useDiscoveryStore } from '@/store/discoveryStore';

const QueryView = lazy(() => import('@/components/Views/QueryView').then((module) => ({ default: module.QueryView })));
const SettingsView = lazy(() => import('@/components/Views/SettingsView').then((module) => ({ default: module.SettingsView })));
const TableView = lazy(() => import('@/components/Views/TableView').then((module) => ({ default: module.TableView })));

export function AppShell() {
  useKeyboardShortcuts();
  const settings = useSettingsStore((state) => state.settings);
  const tabs = useTabStore((state) => state.tabs);
  const activeTabId = useTabStore((state) => state.activeTabId);
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const startDiscoverySync = useDiscoveryStore((state) => state.startSync);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  useEffect(() => {
    if (!settings.wizardCompleted) return;
    const stopSync = startDiscoverySync();
    return () => {
      stopSync();
    };
  }, [startDiscoverySync, settings.wizardCompleted]);

  if (!settings.wizardCompleted) {
    return <SetupWizard />;
  }

  const loadingFallback = (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
      <Spinner />
      <span>Loading workspace...</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="flex w-[260px] flex-col border-r border-border/40 bg-sidebar text-sidebar-foreground">
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15">
              <span className="text-sm font-bold text-primary">C</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none">Caskify</h1>
            </div>
          </div>

          <Button variant="toolbar" size="icon-xs" onClick={() => setSettingsOpen(true)} title="Settings">
            <Settings className="size-3.5" />
          </Button>
        </div>
        <div className="perf-scroll min-h-0 flex-1 overflow-hidden [contain:layout_paint]">
          <ConnectionList />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-background">
        <TabBar />
        <div className="perf-scroll min-h-0 flex-1 overflow-auto [contain:layout_paint]">
          {activeTab ? (
            <Suspense fallback={loadingFallback}>
              {activeTab.mode === 'query' ? <QueryView key={activeTab.id} tab={activeTab} /> : <TableView key={activeTab.id} tab={activeTab} />}
            </Suspense>
          ) : <WelcomeView />}
        </div>
      </main>

      <Suspense fallback={null}>
        <SettingsView open={settingsOpen} onOpenChange={setSettingsOpen} />
      </Suspense>
    </div>
  );
}
