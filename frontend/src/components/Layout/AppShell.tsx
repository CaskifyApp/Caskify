import { Suspense, lazy, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
import caskifyLogo from '@/assets/images/caskify-logo.png';

const QueryView = lazy(() => import('@/components/Views/QueryView').then((module) => ({ default: module.QueryView })));
const SettingsView = lazy(() => import('@/components/Views/SettingsView').then((module) => ({ default: module.SettingsView })));
const TableView = lazy(() => import('@/components/Views/TableView').then((module) => ({ default: module.TableView })));

export function AppShell() {
  useKeyboardShortcuts();
  const theme = useSettingsStore((state) => state.settings.theme);
  const wizardCompleted = useSettingsStore((state) => state.settings.wizardCompleted);
  const activeTab = useTabStore((state) =>
    state.tabs.find((tab) => tab.id === state.activeTabId) ?? null
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const startDiscoverySync = useDiscoveryStore((state) => state.startSync);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (!wizardCompleted) return;
    const stopSync = startDiscoverySync();
    return () => {
      stopSync();
    };
  }, [startDiscoverySync, wizardCompleted]);

  if (!wizardCompleted) {
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
            <div className="flex size-7 items-center justify-center overflow-hidden rounded-lg bg-primary/10 ring-1 ring-border/30">
              <img src={caskifyLogo} alt="Caskify logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none">Caskify</h1>
            </div>
          </div>

          <Button variant="toolbar" size="icon-xs" onClick={() => setSettingsOpen(true)} title="Settings">
            <Settings className="size-3.5" />
          </Button>
        </div>
        <div className="perf-scroll gpu-layer min-h-0 flex-1 overflow-hidden [contain:layout_paint]">
          <ConnectionList />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-background">
        <TabBar />
        <div className="perf-scroll gpu-layer min-h-0 flex-1 overflow-auto [contain:layout_paint]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab?.id ?? 'welcome'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.10, ease: 'easeOut' }}
              className="h-full"
            >
              {activeTab ? (
                <Suspense fallback={loadingFallback}>
                  {activeTab.mode === 'query' ? <QueryView tab={activeTab} /> : <TableView tab={activeTab} />}
                </Suspense>
              ) : <WelcomeView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Suspense fallback={null}>
        <SettingsView open={settingsOpen} onOpenChange={setSettingsOpen} />
      </Suspense>
    </div>
  );
}
