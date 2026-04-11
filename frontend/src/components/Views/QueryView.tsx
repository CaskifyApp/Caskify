import { QueryEditor } from '@/components/QueryEditor/QueryEditor';
import { QueryResultsPanel } from '@/components/QueryEditor/QueryResultsPanel';
import { QueryToolbar } from '@/components/QueryEditor/QueryToolbar';
import { useQueryExecution } from '@/hooks/useQueryExecution';
import { useTabStore } from '@/store/tabStore';
import type { Tab } from '@/types';

interface QueryViewProps {
  tab: Tab;
}

export function QueryView({ tab }: QueryViewProps) {
  const setQueryText = useTabStore((state) => state.setQueryText);
  const setQueryProfile = useTabStore((state) => state.setQueryProfile);
  const { runQuery } = useQueryExecution(tab);

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <QueryToolbar
        profileId={tab.connectionId}
        queryText={tab.queryText ?? ''}
        running={tab.queryLoading ?? false}
        onProfileChange={(profileId) => setQueryProfile(tab.id, profileId)}
        onQueryTextChange={(queryText) => setQueryText(tab.id, queryText)}
        onRun={() => void runQuery()}
      />

      <QueryEditor
        value={tab.queryText ?? ''}
        onChange={(queryText) => setQueryText(tab.id, queryText)}
        onRun={() => void runQuery()}
      />

      <QueryResultsPanel
        result={tab.queryResult ?? null}
        loading={tab.queryLoading ?? false}
        error={tab.queryError ?? null}
      />
    </div>
  );
}
