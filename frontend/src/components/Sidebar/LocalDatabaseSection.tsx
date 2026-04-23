import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HardDrive, Plus, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatabaseTree } from '@/components/Sidebar/DatabaseTree';
import { useDiscoveryStore } from '@/store/discoveryStore';
import type { TreeNode } from '@/types';

interface LocalDatabaseSectionProps {
  onBrowse: (databaseId: string) => Promise<string>;
  onCreateDatabase: () => void;
  onTableSelect: (node: TreeNode) => void;
}

function StatusDot({ active }: { active: boolean }) {
  if (active) {
    return <div className="size-2 shrink-0 rounded-full bg-teal-400 shadow-[0_0_4px_rgba(45,212,191,0.5)]" />;
  }
  return <div className="size-2 shrink-0 rounded-full border border-slate-500 bg-transparent" />;
}

export function LocalDatabaseSection({ onBrowse, onCreateDatabase, onTableSelect }: LocalDatabaseSectionProps) {
  const localDatabases = useDiscoveryStore((state) => state.localDatabases);
  const refreshAll = useDiscoveryStore((state) => state.refreshAll);
  const error = useDiscoveryStore((state) => state.discoveryErrors.local);
  const [browsingId, setBrowsingId] = useState<string | null>(null);
  const [activeDatabaseId, setActiveDatabaseId] = useState<string | null>(null);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);

  const handleBrowse = async (databaseId: string) => {
    setBrowsingId(databaseId);
    try {
      const connectionId = await onBrowse(databaseId);
      setActiveDatabaseId(databaseId);
      setActiveConnectionId(connectionId);
    } finally {
      setBrowsingId(null);
    }
  };

  return (
    <section className="border-b border-border/10">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1.5">
          <HardDrive className="size-3 text-teal-400" />
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-teal-400">Local</h3>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="toolbar" size="icon-xs" title="Create database" onClick={onCreateDatabase}>
            <Plus className="size-3" />
          </Button>
          <Button variant="toolbar" size="icon-xs" title="Refresh local discovery" onClick={() => void refreshAll()}>
            <RefreshCw className="size-3" />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mx-3 mb-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-2.5 py-1.5 text-[11px] text-rose-400">
          {error}
        </div>
      ) : null}

      {!error && localDatabases.length === 0 ? (
        <div className="px-3 pb-3 text-[11px] text-muted-foreground">
          No local databases detected.
        </div>
      ) : null}

      {localDatabases.length > 0 ? (
        <ul>
          {localDatabases.map((database) => (
            <li key={database.id} className="group border-t border-border/5">
              <div className="flex items-center gap-2 px-3 py-1.5">
                <StatusDot active={activeDatabaseId === database.id} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{database.database}</div>
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
                        selectedDatabaseName={database.database}
                        onTableSelect={onTableSelect}
                        flat
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