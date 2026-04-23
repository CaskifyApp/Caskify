import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Container, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatabaseTree } from '@/components/Sidebar/DatabaseTree';
import { useDiscoveryStore } from '@/store/discoveryStore';
import { useSidebarStore } from '@/store/sidebarStore';
import type { TreeNode } from '@/types';

interface DockerDatabaseSectionProps {
  onBrowse: (databaseId: string) => Promise<string>;
  onTableSelect: (node: TreeNode) => void;
}

function StatusDot({ active }: { active: boolean }) {
  if (active) {
    return <div className="size-2 shrink-0 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]" />;
  }
  return <div className="size-2 shrink-0 rounded-full border border-slate-500 bg-transparent" />;
}

export function DockerDatabaseSection({ onBrowse, onTableSelect }: DockerDatabaseSectionProps) {
  const dockerDatabases = useDiscoveryStore((state) => state.dockerDatabases);
  const refreshDocker = useDiscoveryStore((state) => state.refreshDocker);
  const error = useDiscoveryStore((state) => state.discoveryErrors.docker);
  const loadDatabases = useSidebarStore((state) => state.loadDatabases);
  const invalidateConnectionCache = useSidebarStore((state) => state.invalidateConnectionCache);
  const [browsingId, setBrowsingId] = useState<string | null>(null);
  const [activeDatabaseId, setActiveDatabaseId] = useState<string | null>(null);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);

  const handleBrowse = async (databaseId: string) => {
    setBrowsingId(databaseId);
    try {
      const connectionId = await onBrowse(databaseId);
      setActiveDatabaseId(databaseId);
      setActiveConnectionId(connectionId);
      invalidateConnectionCache(connectionId);
      await loadDatabases(connectionId, true);
    } finally {
      setBrowsingId(null);
    }
  };

  const handleRefresh = async () => {
    await refreshDocker();
    if (activeConnectionId) {
      invalidateConnectionCache(activeConnectionId);
      await loadDatabases(activeConnectionId, true);
    }
  };

  useEffect(() => {
    if (!activeDatabaseId || !activeConnectionId) {
      return;
    }

    invalidateConnectionCache(activeConnectionId);
    void loadDatabases(activeConnectionId, true);
  }, [activeConnectionId, activeDatabaseId, dockerDatabases, invalidateConnectionCache, loadDatabases]);

  return (
    <section className="border-b border-border/10">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Container className="size-3 text-amber-400" />
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Docker</h3>
        </div>
        <Button variant="toolbar" size="icon-xs" title="Refresh Docker discovery" onClick={() => void handleRefresh()}>
          <RefreshCw className="size-3" />
        </Button>
      </div>

      {error ? (
        <div className="mx-3 mb-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-2.5 py-1.5 text-[11px] text-rose-400">
          {error}
        </div>
      ) : null}

      {!error && dockerDatabases.length === 0 ? (
        <div className="px-3 pb-3 text-[11px] text-muted-foreground">
          No Docker PostgreSQL containers detected.
        </div>
      ) : null}

      {dockerDatabases.length > 0 ? (
        <ul>
          {dockerDatabases.map((database) => (
            <li key={database.id} className="group border-t border-border/5">
              <div className="flex items-center gap-2 px-3 py-1.5">
                <StatusDot active={activeDatabaseId === database.id} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{database.containerName}</div>
                  <div className="truncate text-[10px] text-muted-foreground">{database.host}:{database.port} {database.database}</div>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                  disabled={browsingId === database.id}
                  onClick={() => void handleBrowse(database.id)}
                >
                  <span>{browsingId === database.id ? 'Opening' : 'Browse'}</span>
                  <ChevronRight className="size-3" />
                </button>
              </div>

              <AnimatePresence>
                {activeDatabaseId === database.id && activeConnectionId ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pb-2 pl-3">
                      <DatabaseTree
                        connectionId={activeConnectionId}
                        connected={true}
                        onTableSelect={onTableSelect}
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}