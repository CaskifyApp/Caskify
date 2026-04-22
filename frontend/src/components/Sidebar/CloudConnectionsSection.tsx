import { Edit2, Plus, Plug, PlugZap, Trash2, Globe } from 'lucide-react';
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
    <section>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Globe className="size-3 text-violet-400" />
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">Cloud</h3>
        </div>
        <Button variant="toolbar" size="icon-xs" onClick={onCreate} title="Add connection">
          <Plus className="size-3" />
        </Button>
      </div>

      {visibleProfiles.length === 0 ? (
        <div className="px-3 pb-3 text-[11px] text-muted-foreground">
          No saved cloud connections yet.
        </div>
      ) : (
        <ul>
          {visibleProfiles.map((profile) => {
            const status = connectionStatuses.get(profile.id);
            const isConnected = status?.connected || false;

            return (
              <li key={profile.id} className="group border-t border-border/5">
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <div className={`size-1 shrink-0 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium">{profile.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {profile.host}:{profile.port}{profile.defaultDatabase ? ` ${profile.defaultDatabase}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    {isConnected ? (
                      <Button variant="toolbar" size="icon-xs" onClick={() => onDisconnect(profile.id)} disabled={disconnecting} title="Disconnect">
                        <PlugZap className="size-3 text-emerald-400" />
                      </Button>
                    ) : (
                      <Button variant="toolbar" size="icon-xs" onClick={() => onConnect(profile.id)} disabled={connecting} title="Connect">
                        <Plug className="size-3" />
                      </Button>
                    )}
                    <Button variant="toolbar" size="icon-xs" onClick={() => onEdit(profile)} title="Edit connection">
                      <Edit2 className="size-3" />
                    </Button>
                    <Button variant="toolbar" size="icon-xs" onClick={() => onDelete(profile)} title="Delete connection">
                      <Trash2 className="size-3 text-rose-400" />
                    </Button>
                  </div>
                </div>

                <div className="pb-2 pl-3">
                  <DatabaseTree
                    connectionId={profile.id}
                    connected={isConnected}
                    selectedDatabaseName={profile.defaultDatabase || profile.database || 'postgres'}
                    onTableSelect={onTableSelect}
                    onRequestDropDatabase={(databaseName) => onRequestDropDatabase(profile, databaseName)}
                  />
                </div>

                {status?.error ? (
                  <div className="px-3 pb-1 text-[10px] text-rose-400">{status.error}</div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
