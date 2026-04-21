import { Edit2, Plus, Plug, PlugZap, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatabaseTree } from '@/components/Sidebar/DatabaseTree';
import type { ConnectionStatus, Profile } from '@/types';
import type { TreeNode } from '@/types';

interface CloudConnectionsSectionProps {
  profiles: Profile[];
  connectionStatuses: Map<string, ConnectionStatus>;
  connecting: boolean;
  disconnecting: boolean;
  onCreate: () => void;
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
  onConnect: (profileId: string) => void;
  onDisconnect: (profileId: string) => void;
  onRequestDropDatabase: (profile: Profile, databaseName: string) => void;
  onTableSelect: (node: TreeNode) => void;
}

export function CloudConnectionsSection({
  profiles,
  connectionStatuses,
  connecting,
  disconnecting,
  onCreate,
  onEdit,
  onDelete,
  onConnect,
  onDisconnect,
  onRequestDropDatabase,
  onTableSelect,
}: CloudConnectionsSectionProps) {
  const visibleProfiles = profiles.filter((profile) => !profile.hidden);

  return (
    <section className="px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cloud Connections</h3>
          <p className="text-xs text-muted-foreground">Saved manual profiles for hosted or remote PostgreSQL.</p>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onCreate} title="Add connection">
          <Plus className="size-4" />
        </Button>
      </div>

      {visibleProfiles.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-3 py-3 text-xs text-muted-foreground">
          No saved cloud connections yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {visibleProfiles.map((profile) => {
            const status = connectionStatuses.get(profile.id);
            const isConnected = status?.connected || false;

            return (
              <li key={profile.id} className="rounded-2xl border bg-background/70">
                <div className="group flex items-center gap-2 p-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{profile.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {profile.host}:{profile.port}{profile.defaultDatabase ? ` • ${profile.defaultDatabase}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {isConnected ? (
                      <Button variant="ghost" size="icon-xs" onClick={() => onDisconnect(profile.id)} disabled={disconnecting} title="Disconnect">
                        <PlugZap className="size-3 text-green-500" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon-xs" onClick={() => onConnect(profile.id)} disabled={connecting} title="Connect">
                        <Plug className="size-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-xs" onClick={() => onEdit(profile)} title="Edit connection">
                      <Edit2 className="size-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => onDelete(profile)} title="Delete connection">
                      <Trash2 className="size-3 text-destructive" />
                    </Button>
                  </div>
                </div>

                <DatabaseTree
                  connectionId={profile.id}
                  connected={isConnected}
                  selectedDatabaseName={profile.defaultDatabase || profile.database || 'postgres'}
                  onTableSelect={onTableSelect}
                  onRequestDropDatabase={(databaseName) => onRequestDropDatabase(profile, databaseName)}
                />

                {status?.error ? <div className="px-3 pb-2 text-xs text-destructive">{status.error}</div> : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
