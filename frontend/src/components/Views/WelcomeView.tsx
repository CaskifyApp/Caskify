import { DatabaseZap } from 'lucide-react';

export function WelcomeView() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md rounded-4xl border bg-card px-6 py-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <DatabaseZap className="size-6" />
        </div>
        <h2 className="text-lg font-semibold">Choose a connection to explore</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect a saved profile from the sidebar, expand a database tree, then pick a table to open a workspace tab.
        </p>
      </div>
    </div>
  );
}
