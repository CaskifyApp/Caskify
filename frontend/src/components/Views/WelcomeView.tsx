import { DatabaseZap, HardDrive, Container, Globe, PlugZap, Zap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyHeader } from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import { useConnectionStore } from '@/store/connectionStore';
import { useTabStore } from '@/store/tabStore';

function getProfileIcon(sourceKind?: string) {
  switch (sourceKind) {
    case 'local':
      return HardDrive;
    case 'docker':
      return Container;
    default:
      return Globe;
  }
}

function getProfileColor(sourceKind?: string) {
  switch (sourceKind) {
    case 'local':
      return 'text-teal-400';
    case 'docker':
      return 'text-amber-400';
    default:
      return 'text-violet-400';
  }
}

function getProfileDotColor(sourceKind?: string) {
  switch (sourceKind) {
    case 'local':
      return 'bg-teal-400';
    case 'docker':
      return 'bg-amber-400';
    default:
      return 'bg-violet-400';
  }
}

export function WelcomeView() {
  const profiles = useConnectionStore((state) => state.profiles);
  const connectionStatuses = useConnectionStore((state) => state.connectionStatuses);
  const featuredProfiles = profiles.slice(0, 5);
  const openQueryTabForConnection = useTabStore((state) => state.openQueryTabForConnection);

  const connectedCount = Array.from(connectionStatuses.values()).filter((s) => s.connected).length;
  const totalDatabases = profiles.length;

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col justify-center">
          <Empty className="items-start px-0 py-0 text-left md:py-0">
            <EmptyMedia variant="icon">
              <DatabaseZap className="size-5 text-primary" />
            </EmptyMedia>
            <EmptyHeader className="items-start text-left">
              <EmptyTitle className="text-2xl">Choose a connection to explore</EmptyTitle>
              <EmptyDescription className="max-w-md">
                Connect a saved profile from the sidebar, expand a database tree, then pick a table to open a workspace tab. You can also open a fresh SQL workspace any time.
              </EmptyDescription>
            </EmptyHeader>

            <div className="mt-2 flex items-center gap-3">
              <Button
                variant="action"
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent('caskify:quick-local-server'))}
              >
                <Zap className="size-3.5" />
                Quick Add Local Server
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent('caskify:new-query'))}
              >
                Open SQL Editor
                <ChevronRight className="size-3.5" />
              </Button>
            </div>

            {totalDatabases > 0 && (
              <div className="mt-8 flex gap-6 border-t border-border/20 pt-6">
                <div>
                  <div className="text-2xl font-semibold">{totalDatabases}</div>
                  <div className="text-xs text-muted-foreground">Connections</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-emerald-400">{connectedCount}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
              </div>
            )}
          </Empty>
        </div>

        <div className="flex flex-col justify-center">
          <div className="rounded-2xl border border-border/40 bg-card/50 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Recent Connections</h3>
              {featuredProfiles.length > 0 && (
                <span className="text-xs text-muted-foreground">{featuredProfiles.length} saved</span>
              )}
            </div>

            {featuredProfiles.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border/20 px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">No saved profiles yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Start by adding your first PostgreSQL server from the sidebar.</p>
              </div>
            ) : (
              <ul className="mt-3 space-y-0.5">
                {featuredProfiles.map((profile) => {
                  const connected = connectionStatuses.get(profile.id)?.connected ?? false;
                  const ProfileIcon = getProfileIcon(profile.sourceKind);
                  const iconColor = getProfileColor(profile.sourceKind);
                  const dotColor = getProfileDotColor(profile.sourceKind);

                  return (
                    <li
                      key={profile.id}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]',
                        connected && 'cursor-pointer'
                      )}
                      onClick={() => {
                        if (connected) {
                          openQueryTabForConnection(profile.id, profile.defaultDatabase || 'postgres', profile.name);
                        }
                      }}
                    >
                      <div className={`size-2 shrink-0 rounded-full ${dotColor}`} />
                      <ProfileIcon className={cn('size-3.5 shrink-0', iconColor)} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{profile.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {profile.host}:{profile.port} {profile.defaultDatabase || 'postgres'}
                        </div>
                      </div>
                      {connected && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                          <PlugZap className="size-3" />
                          <span className="hidden sm:inline">Connected</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
