import { useMemo, useState } from 'react';
import { HardDrive, Container, Globe, PlugZap, Zap, ChevronRight, Loader2, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useConnectionStore } from '@/store/connectionStore';
import { useDiscoveryStore } from '@/store/discoveryStore';
import { useTabStore } from '@/store/tabStore';
import type { Profile } from '@/types';

function BackgroundParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 30 + 15,
      delay: Math.random() * -30,
    }));
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/10"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [`${p.y}%`, `${p.y - 15 - Math.random() * 20}%`, `${p.y}%`],
            x: [`${p.x}%`, `${p.x + (Math.random() * 10 - 5)}%`, `${p.x}%`],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

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
  const connectProfile = useConnectionStore((state) => state.connectProfile);
  const openQueryTab = useTabStore((state) => state.openQueryTab);
  const openQueryTabForConnection = useTabStore((state) => state.openQueryTabForConnection);
  
  const localDatabases = useDiscoveryStore((state) => state.localDatabases);
  const dockerDatabases = useDiscoveryStore((state) => state.dockerDatabases);

  const [connectingId, setConnectingId] = useState<string | null>(null);

  const featuredProfiles = profiles.slice(0, 8);
  const visibleCloudProfiles = profiles.filter((p) => !p.hidden);

  const connectedCount = Array.from(connectionStatuses.values()).filter((s) => s.connected).length;
  const totalDatabases = localDatabases.length + dockerDatabases.length + visibleCloudProfiles.length;

  const handleProfileClick = async (profile: Profile) => {
    const isConnected = connectionStatuses.get(profile.id)?.connected;
    if (isConnected) {
      openQueryTabForConnection(profile.id, profile.defaultDatabase || 'postgres', profile.name);
    } else {
      try {
        setConnectingId(profile.id);
        await connectProfile(profile.id);
        openQueryTabForConnection(profile.id, profile.defaultDatabase || 'postgres', profile.name);
      } catch (err) {
        console.error('Failed to auto-connect', err);
      } finally {
        setConnectingId(null);
      }
    }
  };

  return (
    <div className="relative flex h-full items-center justify-center p-8">
      <BackgroundParticles />
      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center justify-center">
        
        {totalDatabases > 0 && (
          <div className="mb-10 flex gap-8">
            <div className="flex flex-col items-center">
              <div className="text-3xl font-semibold tracking-tight">{totalDatabases}</div>
              <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Connections</div>
            </div>
            <div className="h-10 w-px bg-border/40" />
            <div className="flex flex-col items-center">
              <div className="text-3xl font-semibold tracking-tight text-emerald-400">{connectedCount}</div>
              <div className="text-[11px] font-medium uppercase tracking-widest text-emerald-400/70">Active</div>
            </div>
          </div>
        )}

        <div className="w-full max-w-xl rounded-2xl border border-border/40 bg-card/50 p-6 shadow-sm backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">Recent Connections</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-xs"
                className="size-7"
                onClick={() => window.dispatchEvent(new CustomEvent('caskify:quick-local-server'))}
                title="Quick Add Local Server"
              >
                <Zap className="size-3.5 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="size-7"
                onClick={() => openQueryTab()}
                title="New Query Tab"
              >
                <Play className="size-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {featuredProfiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/20 px-4 py-12 text-center">
              <p className="text-sm font-medium text-foreground">No saved profiles yet.</p>
              <p className="mt-1 text-xs text-muted-foreground">Start by adding your first PostgreSQL server from the sidebar.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {featuredProfiles.map((profile) => {
                const connected = connectionStatuses.get(profile.id)?.connected ?? false;
                const isConnecting = connectingId === profile.id;
                const ProfileIcon = getProfileIcon(profile.sourceKind);
                const iconColor = getProfileColor(profile.sourceKind);
                const dotColor = getProfileDotColor(profile.sourceKind);

                return (
                  <li
                    key={profile.id}
                    className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-black/5 dark:hover:bg-white/[0.03]"
                    onClick={() => void handleProfileClick(profile)}
                  >
                    <div className={`size-2 shrink-0 rounded-full ${dotColor}`} />
                    <ProfileIcon className={cn('size-4 shrink-0 opacity-70', iconColor)} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium leading-none">{profile.name}</div>
                      <div className="mt-1 truncate text-[11px] text-muted-foreground">
                        {profile.host}:{profile.port} <span className="mx-1 opacity-50">&bull;</span> {profile.defaultDatabase || 'postgres'}
                      </div>
                    </div>
                    {isConnecting ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
                        <Loader2 className="size-3 animate-spin" />
                        <span>Connecting</span>
                      </div>
                    ) : connected ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                        <PlugZap className="size-3" />
                        <span>Connected</span>
                      </div>
                    ) : (
                      <ChevronRight className="size-4 opacity-0 transition-opacity group-hover:opacity-50 text-muted-foreground" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
