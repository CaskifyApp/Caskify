import { QueryEditor } from '@/components/QueryEditor/QueryEditor';
import { QueryToolbar } from '@/components/QueryEditor/QueryToolbar';
import { useTabStore } from '@/store/tabStore';
import type { Tab } from '@/types';

interface QueryViewProps {
  tab: Tab;
}

export function QueryView({ tab }: QueryViewProps) {
  const setQueryText = useTabStore((state) => state.setQueryText);
  const setQueryProfile = useTabStore((state) => state.setQueryProfile);

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <QueryToolbar
        profileId={tab.connectionId}
        queryText={tab.queryText ?? ''}
        running={tab.queryLoading ?? false}
        onProfileChange={(profileId) => setQueryProfile(tab.id, profileId)}
        onQueryTextChange={(queryText) => setQueryText(tab.id, queryText)}
        onRun={() => undefined}
      />

      <QueryEditor
        value={tab.queryText ?? ''}
        onChange={(queryText) => setQueryText(tab.id, queryText)}
        onRun={() => undefined}
      />

      <div className="rounded-4xl border border-dashed bg-card/80 p-5 text-sm text-muted-foreground shadow-sm">
        Query results panel will appear here after query execution is wired.
      </div>
    </div>
  );
}
