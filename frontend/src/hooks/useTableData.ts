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

  const params = useMemo(() => (tab ? buildTablePageParams(tab) : null), [tab]);

  useEffect(() => {
    if (!tab || !params) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setTableLoading(tab.id, true);
      setTableError(tab.id, null);

      try {
        const [tableColumns, tableData] = await Promise.all([
          wails.GetTableColumns(tab.connectionId, tab.schemaName!, tab.tableName!),
          wails.GetTablePage(params),
        ]);

        if (cancelled) {
          return;
        }

        const normalizedTableData: TablePageResult = {
          ...tableData,
          sortDir: tableData.sortDir === 'desc' ? 'desc' : tableData.sortDir === 'asc' ? 'asc' : undefined,
        };

        setTableData(tab.id, normalizedTableData, tableColumns);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setTableLoading(tab.id, false);
        setTableError(tab.id, String(error));
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [params, setTableData, setTableError, setTableLoading, tab]);

  return {
    tableData: tab?.tableData ?? null,
    tableColumns: tab?.tableColumns ?? [],
    tableLoading: tab?.tableLoading ?? false,
    tableError: tab?.tableError ?? null,
  };
}
