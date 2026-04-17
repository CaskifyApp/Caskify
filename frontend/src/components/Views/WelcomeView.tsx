import { DatabaseZap, PlugZap } from 'lucide-react';
import { useConnectionStore } from '@/store/connectionStore';

export function WelcomeView() {
  const profiles = useConnectionStore((state) => state.profiles);
  const connectionStatuses = useConnectionStore((state) => state.connectionStatuses);
  const featuredProfiles = profiles.filter((profile) => !profile.hidden).slice(0, 3);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="grid max-w-4xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-4xl border bg-card px-6 py-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <DatabaseZap className="size-6" />
        </div>
        <h2 className="text-lg font-semibold">Choose a connection to explore</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect a saved profile from the sidebar, expand a database tree, then pick a table to open a workspace tab.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          You can also open a fresh SQL workspace any time from the New Query button in the tab bar.
        </p>
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            className="rounded-full border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            onClick={() => window.dispatchEvent(new CustomEvent('caskify:quick-local-server'))}
          >
            Quick Add Local Server
          </button>
        </div>
        </div>

        <div className="rounded-4xl border bg-card px-6 py-8 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">Recent Connections</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Jump back into the server profiles you have already configured.
          </p>

          <div className="mt-4 grid gap-3">
            {featuredProfiles.length === 0 ? (
              <div className="rounded-3xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                No saved profiles yet. Start by adding your first PostgreSQL server.
              </div>
            ) : featuredProfiles.map((profile) => {
              const connected = connectionStatuses.get(profile.id)?.connected ?? false;
              return (
                <div key={profile.id} className="rounded-3xl border px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-foreground">{profile.name}</div>
                      <div className="text-xs text-muted-foreground">{profile.host}:{profile.port} • {profile.defaultDatabase || 'postgres'}</div>
                    </div>
                    <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${connected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <PlugZap className="size-3" />
                      {connected ? 'Connected' : 'Saved'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
