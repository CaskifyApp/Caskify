import { useEffect, useState } from 'react';
import { Container, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatabaseTree } from '@/components/Sidebar/DatabaseTree';
import { useDiscoveryStore } from '@/store/discoveryStore';
import { useSidebarStore } from '@/store/sidebarStore';
import type { TreeNode } from '@/types';

interface DockerDatabaseSectionProps {
  onBrowse: (databaseId: string) => Promise<string>;
  onTableSelect: (node: TreeNode) => void;
}

export function DockerDatabaseSection({ onBrowse, onTableSelect }: DockerDatabaseSectionProps) {
  const dockerDatabases = useDiscoveryStore((state) => state.dockerDatabases);
  const refreshDocker = useDiscoveryStore((state) => state.refreshDocker);
  const error = useDiscoveryStore((state) => state.discoveryErrors.docker);
  const loadDatabases = useSidebarStore((state) => state.loadDatabases);
  const [browsingId, setBrowsingId] = useState<string | null>(null);
  const [activeDatabaseId, setActiveDatabaseId] = useState<string | null>(null);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);

  const handleBrowse = async (databaseId: string) => {
    setBrowsingId(databaseId);
    try {
      const connectionId = await onBrowse(databaseId);
      setActiveDatabaseId(databaseId);
      setActiveConnectionId(connectionId);
      await loadDatabases(connectionId, true);
    } finally {
      setBrowsingId(null);
    }
  };

  const handleRefresh = async () => {
    await refreshDocker();
    if (activeConnectionId) {
      await loadDatabases(activeConnectionId, true);
    }
  };

  useEffect(() => {
    if (!activeDatabaseId || !activeConnectionId) {
      return;
    }

    void loadDatabases(activeConnectionId, true);
  }, [activeConnectionId, activeDatabaseId, dockerDatabases, loadDatabases]);

  return (
    <section className="border-b px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Docker Databases</h3>
          <p className="text-xs text-muted-foreground">Detected PostgreSQL containers from Docker.</p>
        </div>
        <Button variant="ghost" size="icon-xs" title="Refresh Docker discovery" onClick={() => void handleRefresh()}>
          <RefreshCw className="size-3" />
        </Button>
      </div>

      {error ? <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div> : null}

      {!error && dockerDatabases.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-3 py-3 text-xs text-muted-foreground">
          No Docker PostgreSQL containers detected.
        </div>
      ) : null}

      {dockerDatabases.length > 0 ? (
        <ul className="space-y-2">
          {dockerDatabases.map((database) => (
            <li key={database.id} className="rounded-2xl border bg-background/70 px-3 py-2">
              <div className="flex items-center gap-2">
                <Container className="size-3.5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{database.containerName}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{database.host}:{database.port} • {database.database}</div>
                </div>
                <Button variant="outline" size="xs" disabled={browsingId === database.id} onClick={() => void handleBrowse(database.id)}>
                  {browsingId === database.id ? 'Opening...' : 'Browse'}
                </Button>
              </div>

              {activeDatabaseId === database.id && activeConnectionId ? (
                <DatabaseTree
                  connectionId={activeConnectionId}
                  connected={true}
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
