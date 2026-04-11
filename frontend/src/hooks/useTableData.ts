import { useEffect, useMemo } from 'react';
import * as wails from '../../wailsjs/go/main/App';
import { useTabStore } from '@/store/tabStore';
import type { TablePageParams, TablePageResult, Tab } from '@/types';

function buildTablePageParams(tab: Tab): TablePageParams | null {
  if (!tab.connectionId || !tab.databaseName || !tab.schemaName || !tab.tableName) {
    return null;
  }

  return {
    profileId: tab.connectionId,
    database: tab.databaseName,
    schema: tab.schemaName,
    table: tab.tableName,
    page: tab.pagination?.page ?? 1,
    limit: tab.pagination?.limit ?? 50,
    sortColumn: tab.sortColumn,
    sortDir: tab.sortDir,
  };
}

export function useTableData(tab: Tab | null) {
  const setTableLoading = useTabStore((state) => state.setTableLoading);
  const setTableError = useTabStore((state) => state.setTableError);
  const setTableData = useTabStore((state) => state.setTableData);
  const tabId = tab?.id ?? null;
  const connectionId = tab?.connectionId ?? null;
  const schemaName = tab?.schemaName ?? null;
  const tableName = tab?.tableName ?? null;

  const params = useMemo(() => {
    if (!tab) {
      return null;
    }

    return buildTablePageParams(tab);
  }, [
    connectionId,
    schemaName,
    tableName,
    tab?.databaseName,
    tab?.pagination?.page,
    tab?.pagination?.limit,
    tab?.sortColumn,
    tab?.sortDir,
  ]);

  useEffect(() => {
    if (!tabId || !connectionId || !schemaName || !tableName || !params) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setTableLoading(tabId, true);
      setTableError(tabId, null);

      try {
        const [tableColumns, tableData] = await Promise.all([
          wails.GetTableColumns(connectionId, schemaName, tableName),
          wails.GetTablePage(params),
        ]);

        if (cancelled) {
          return;
        }

        const normalizedTableData: TablePageResult = {
          ...tableData,
          sortDir: tableData.sortDir === 'desc' ? 'desc' : tableData.sortDir === 'asc' ? 'asc' : undefined,
        };

        setTableData(tabId, normalizedTableData, tableColumns);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setTableLoading(tabId, false);
        setTableError(tabId, String(error));
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [connectionId, params, schemaName, setTableData, setTableError, setTableLoading, tabId, tableName]);

  return {
    tableData: tab?.tableData ?? null,
    tableColumns: tab?.tableColumns ?? [],
    tableLoading: tab?.tableLoading ?? false,
    tableError: tab?.tableError ?? null,
  };
}
