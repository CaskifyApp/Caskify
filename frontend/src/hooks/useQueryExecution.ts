import * as wails from '../../wailsjs/go/main/App';
import { useTabStore } from '@/store/tabStore';
import type { QueryExecutionParams, Tab } from '@/types';

export function useQueryExecution(tab: Tab) {
  const setQueryLoading = useTabStore((state) => state.setQueryLoading);
  const setQueryError = useTabStore((state) => state.setQueryError);
  const setQueryResult = useTabStore((state) => state.setQueryResult);

  const runQuery = async () => {
    if (!tab.connectionId) {
      setQueryError(tab.id, 'Choose a connection before running a query.');
      return;
    }

    if (!tab.databaseName) {
      setQueryError(tab.id, 'Choose a database before running a query.');
      return;
    }

    if (!tab.queryText?.trim()) {
      setQueryError(tab.id, 'Query text is empty.');
      return;
    }

    setQueryLoading(tab.id, true);
    setQueryError(tab.id, null);

    try {
      const payload: QueryExecutionParams = {
        profileId: tab.connectionId,
        database: tab.databaseName,
        sql: tab.queryText,
      };

      const queryResult = await wails.RunQuery(payload);
      setQueryResult(tab.id, queryResult);
    } catch (error) {
      setQueryLoading(tab.id, false);
      setQueryError(tab.id, String(error));
    }
  };

  return { runQuery };
}
