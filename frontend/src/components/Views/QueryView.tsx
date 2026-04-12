import { Group, Panel, Separator } from 'react-resizable-panels';
import { useState } from 'react';
import { useEffect } from 'react';
import { SaveQueryModal } from '@/components/Modals/SaveQueryModal';
import { QueryEditor } from '@/components/QueryEditor/QueryEditor';
import { QueryResultsPanel } from '@/components/QueryEditor/QueryResultsPanel';
import { QueryToolbar } from '@/components/QueryEditor/QueryToolbar';
import { HistoryView } from '@/components/Views/HistoryView';
import { SavedQueriesView } from '@/components/Views/SavedQueriesView';
import { useQueryExecution } from '@/hooks/useQueryExecution';
import { useTabStore } from '@/store/tabStore';
import type { Tab } from '@/types';

interface QueryViewProps {
  tab: Tab;
}

export function QueryView({ tab }: QueryViewProps) {
  const setQueryText = useTabStore((state) => state.setQueryText);
  const setQueryProfile = useTabStore((state) => state.setQueryProfile);
  const setQueryDatabase = useTabStore((state) => state.setQueryDatabase);
  const { runQuery, cancelQuery } = useQueryExecution(tab);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savedQueriesOpen, setSavedQueriesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const handleRun = (event: Event) => {
      const customEvent = event as CustomEvent<{ tabId: string }>;
      if (customEvent.detail?.tabId === tab.id) {
        void runQuery();
      }
    };

    const handleSave = (event: Event) => {
      const customEvent = event as CustomEvent<{ tabId: string }>;
      if (customEvent.detail?.tabId === tab.id) {
        setSaveModalOpen(true);
      }
    };

    window.addEventListener('caskpg:run-query', handleRun);
    window.addEventListener('caskpg:save-query', handleSave);

    return () => {
      window.removeEventListener('caskpg:run-query', handleRun);
      window.removeEventListener('caskpg:save-query', handleSave);
    };
  }, [runQuery, tab.id]);

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <QueryToolbar
        profileId={tab.connectionId}
        databaseName={tab.databaseName ?? ''}
        queryText={tab.queryText ?? ''}
        running={tab.queryLoading ?? false}
        onProfileChange={(profileId) => setQueryProfile(tab.id, profileId)}
        onDatabaseChange={(databaseName) => setQueryDatabase(tab.id, databaseName)}
        onQueryTextChange={(queryText) => setQueryText(tab.id, queryText)}
        onRun={() => void runQuery()}
        onCancel={() => void cancelQuery()}
        onSave={() => setSaveModalOpen(true)}
        onShowSavedQueries={() => setSavedQueriesOpen(true)}
        onShowHistory={() => setHistoryOpen(true)}
      />

      <Group orientation="vertical" className="min-h-0 flex-1 gap-2">
        <Panel defaultSize={55} minSize={30}>
          <QueryEditor
            value={tab.queryText ?? ''}
            onChange={(queryText) => setQueryText(tab.id, queryText)}
            onRun={() => void runQuery()}
          />
        </Panel>

        <Separator className="h-2 rounded-full bg-border/60" />

        <Panel defaultSize={45} minSize={20}>
          <QueryResultsPanel
            result={tab.queryResult ?? null}
            loading={tab.queryLoading ?? false}
            error={tab.queryError ?? null}
          />
        </Panel>
      </Group>

      <SaveQueryModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        queryText={tab.queryText ?? ''}
      />

      <SavedQueriesView
        open={savedQueriesOpen}
        onOpenChange={setSavedQueriesOpen}
        onSelectQuery={(query) => {
          setQueryText(tab.id, query);
          setSavedQueriesOpen(false);
        }}
      />

      <HistoryView
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onSelectQuery={(query) => {
          setQueryText(tab.id, query);
          setHistoryOpen(false);
        }}
      />
    </div>
  );
}
