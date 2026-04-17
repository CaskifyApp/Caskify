import { useState } from 'react';
import { HardDrive, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatabaseTree } from '@/components/Sidebar/DatabaseTree';
import { useDiscoveryStore } from '@/store/discoveryStore';
import type { TreeNode } from '@/types';

interface LocalDatabaseSectionProps {
  onBrowse: (databaseId: string) => Promise<string>;
  onTableSelect: (node: TreeNode) => void;
}

export function LocalDatabaseSection({ onBrowse, onTableSelect }: LocalDatabaseSectionProps) {
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
    <section className="border-b px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Local Databases</h3>
          <p className="text-xs text-muted-foreground">Auto-discovered native PostgreSQL databases.</p>
        </div>
        <Button variant="ghost" size="icon-xs" title="Refresh local discovery" onClick={() => void refreshAll()}>
          <RefreshCw className="size-3" />
        </Button>
      </div>

      {error ? <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div> : null}

      {!error && localDatabases.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-3 py-3 text-xs text-muted-foreground">
          No local databases detected yet.
        </div>
      ) : null}

      {localDatabases.length > 0 ? (
        <ul className="space-y-2">
          {localDatabases.map((database) => (
            <li key={database.id} className="rounded-2xl border bg-background/70 px-3 py-2">
              <div className="flex items-center gap-2">
                <HardDrive className="size-3.5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{database.database}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{database.label} as {database.username}</div>
                </div>
                <Button variant="outline" size="xs" disabled={browsingId === database.id} onClick={() => void handleBrowse(database.id)}>
                  {browsingId === database.id ? 'Opening...' : 'Browse'}
                </Button>
              </div>

              {activeDatabaseId === database.id && activeConnectionId ? (
                <DatabaseTree
                  connectionId={activeConnectionId}
                  connected={true}
                  selectedDatabaseName={database.database}
                  onTableSelect={onTableSelect}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
