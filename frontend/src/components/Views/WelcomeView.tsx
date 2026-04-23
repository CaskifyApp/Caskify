import { useMemo, useState } from 'react';
import {
  HardDrive,
  Container,
  Globe,
  PlugZap,
  ChevronRight,
  Loader2,
  Play,
  Plus,
  Database,
  Table as TableIcon,
  Terminal,
  X,
  Clock,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useConnectionStore } from '@/store/connectionStore';
import { useDiscoveryStore } from '@/store/discoveryStore';
import { useTabStore } from '@/store/tabStore';
import { useCountUp } from '@/hooks/useCountUp';
import type { ActivityItem, Profile } from '@/types';

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

function getProfileLabel(sourceKind?: string) {
  switch (sourceKind) {
    case 'local':
      return 'Local';
    case 'docker':
      return 'Docker';
    default:
      return 'Cloud';
  }
}

function getProfileBadgeColor(sourceKind?: string) {
  switch (sourceKind) {
    case 'local':
      return 'bg-teal-400/10 text-teal-400 border-teal-400/20';
    case 'docker':
      return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
    default:
      return 'bg-violet-400/10 text-violet-400 border-violet-400/20';
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'connect':
      return PlugZap;
    case 'disconnect':
      return X;
    case 'query':
      return Terminal;
    case 'table_open':
      return TableIcon;
    case 'tab_close':
      return X;
    default:
      return Clock;
  }
}

function getActivityColor(type: ActivityItem['type']) {
  switch (type) {
    case 'connect':
      return 'text-emerald-400';
    case 'disconnect':
      return 'text-muted-foreground';
    case 'query':
      return 'text-sky-400';
    case 'table_open':
      return 'text-amber-400';
    case 'tab_close':
      return 'text-muted-foreground';
    default:
      return 'text-muted-foreground';
  }
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function QuickAction({ icon, label, onClick }: QuickActionProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-border/30 bg-card/60 px-4 py-2.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:border-border/50"
    >
      {icon}
      {label}
    </motion.button>
  );
}

interface TemplateCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function TemplateCard({ icon, title, description, onClick }: TemplateCardProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-border/30 bg-card/40 p-4 text-left transition-colors hover:bg-accent hover:border-border/50"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-[11px] text-muted-foreground">{description}</div>
      </div>
      <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground/40" />
    </motion.button>
  );
}

function AnimatedStat({ value, label, color }: { value: number; label: string; color?: string }) {
  const { value: animated } = useCountUp(value, { duration: 1000 });
  return (
    <div className="flex flex-col items-center">
      <div className={cn('text-3xl font-semibold tracking-tight', color)}>{animated}</div>
      <div className={cn('text-[11px] font-medium uppercase tracking-widest', color ? `${color}/70` : 'text-muted-foreground')}>
        {label}
      </div>
    </div>
  );
}

export function WelcomeView() {
  const profiles = useConnectionStore((state) => state.profiles);
  const connectionStatuses = useConnectionStore((state) => state.connectionStatuses);
  const connectProfile = useConnectionStore((state) => state.connectProfile);
  const openQueryTab = useTabStore((state) => state.openQueryTab);
  const openQueryTabForConnection = useTabStore((state) => state.openQueryTabForConnection);
  const activityLog = useTabStore((state) => state.activityLog);

  const localDatabases = useDiscoveryStore((state) => state.localDatabases);
  const dockerDatabases = useDiscoveryStore((state) => state.dockerDatabases);

  const [connectingId, setConnectingId] = useState<string | null>(null);

  const featuredProfiles = profiles.slice(0, 8);
  const visibleCloudProfiles = profiles.filter((p) => !p.hidden);

  const connectedCount = Array.from(connectionStatuses.values()).filter((s) => s.connected).length;
  const totalDatabases = localDatabases.length + dockerDatabases.length + visibleCloudProfiles.length;

  const recentActivity = activityLog.slice(0, 6);

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

  const handleAddConnection = () => {
    window.dispatchEvent(new CustomEvent('caskify:new-connection'));
  };

  const handleTemplateDocker = () => {
    const event = new CustomEvent('caskify:new-connection', {
      detail: {
        initialProfile: {
          name: 'Docker PostgreSQL',
          host: 'localhost',
          port: 5432,
          defaultDatabase: 'postgres',
          username: 'postgres',
          ssl_mode: 'disable',
        },
      },
    });
    window.dispatchEvent(event);
  };

  const handleTemplateSupabase = () => {
    const event = new CustomEvent('caskify:new-connection', {
      detail: {
        initialProfile: {
          name: 'Supabase',
          host: '',
          port: 5432,
          defaultDatabase: 'postgres',
          username: 'postgres',
          ssl_mode: 'require',
        },
      },
    });
    window.dispatchEvent(event);
  };

  const hasProfiles = featuredProfiles.length > 0;

  return (
    <div className="relative flex h-full items-center justify-center p-8">
      <BackgroundParticles />
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center">

        {totalDatabases > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 flex gap-8"
          >
            <AnimatedStat value={totalDatabases} label="Connections" />
            <div className="h-10 w-px bg-border/40" />
            <AnimatedStat value={connectedCount} label="Active" color="text-emerald-400" />
          </motion.div>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <QuickAction
            icon={<Plus className="size-3.5" />}
            label="New Query"
            onClick={openQueryTab}
          />
          <QuickAction
            icon={<Database className="size-3.5" />}
            label="Add Connection"
            onClick={handleAddConnection}
          />
        </div>

        <div className="flex w-full gap-4 items-start">
          <div className="flex-1 min-w-0 rounded-2xl border border-border/40 bg-card/50 p-6 shadow-sm backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">
              {hasProfiles ? 'Recent Connections' : 'Get Started'}
            </h3>
            <div className="flex items-center gap-2">
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

          {!hasProfiles ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                Choose a template to add your first PostgreSQL server.
              </p>
              <TemplateCard
                icon={<HardDrive className="size-4 text-teal-400" />}
                title="Local PostgreSQL"
                description="Connect to a local server running on your machine."
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('caskify:new-connection', {
                      detail: {
                        initialProfile: {
                          name: 'Local PostgreSQL',
                          host: 'localhost',
                          port: 5432,
                          defaultDatabase: 'postgres',
                          username: 'postgres',
                          ssl_mode: 'auto',
                        },
                      },
                    })
                  )
                }
              />
              <TemplateCard
                icon={<Container className="size-4 text-amber-400" />}
                title="Docker PostgreSQL"
                description="Connect to a PostgreSQL container."
                onClick={handleTemplateDocker}
              />
              <TemplateCard
                icon={<Globe className="size-4 text-violet-400" />}
                title="Supabase / Cloud"
                description="Connect to a remote hosted database with SSL."
                onClick={handleTemplateSupabase}
              />
            </div>
          ) : (
            <ul className="space-y-1">
              {featuredProfiles.map((profile) => {
                const connected = connectionStatuses.get(profile.id)?.connected ?? false;
                const isConnecting = connectingId === profile.id;
                const ProfileIcon = getProfileIcon(profile.sourceKind);
                const iconColor = getProfileColor(profile.sourceKind);
                const dotColor = getProfileDotColor(profile.sourceKind);
                const sourceLabel = getProfileLabel(profile.sourceKind);
                const badgeColor = getProfileBadgeColor(profile.sourceKind);

                return (
                  <li
                    key={profile.id}
                    className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
                    onClick={() => void handleProfileClick(profile)}
                  >
                    <div className={`size-2 shrink-0 rounded-full ${dotColor}`} />
                    <ProfileIcon className={cn('size-4 shrink-0 opacity-70', iconColor)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-medium leading-none">{profile.name}</div>
                        <span className={cn('rounded-full border px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wider', badgeColor)}>
                          {sourceLabel}
                        </span>
                      </div>
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

          {recentActivity.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="w-[280px] shrink-0 rounded-2xl border border-border/40 bg-card/50 p-5 shadow-sm backdrop-blur-md"
            >
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent Activity</h4>
            <ul className="space-y-2">
              {recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const color = getActivityColor(activity.type);
                return (
                  <li key={activity.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/50">
                    <Icon className={cn('size-3.5 shrink-0', color)} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-foreground">{activity.label}</div>
                      {activity.detail && (
                        <div className="truncate text-[10px] text-muted-foreground">{activity.detail}</div>
                      )}
                    </div>
                    <div className="shrink-0 text-[10px] text-muted-foreground/60">{timeAgo(activity.timestamp)}</div>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
        </div>
      </div>
    </div>
  );
}
