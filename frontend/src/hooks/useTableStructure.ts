import { useEffect } from 'react';
import * as wails from '../../wailsjs/go/main/App';
import { useTabStore } from '@/store/tabStore';
import type { ColumnDef, ForeignKeyInfo, TableIndexInfo, Tab } from '@/types';

const EMPTY_COLUMNS: ColumnDef[] = [];
const EMPTY_INDEXES: TableIndexInfo[] = [];
const EMPTY_FOREIGN_KEYS: ForeignKeyInfo[] = [];

export function useTableStructure(tab: Tab | null) {
  const setStructureLoading = useTabStore((state) => state.setStructureLoading);
  const setStructureError = useTabStore((state) => state.setStructureError);
  const setStructureData = useTabStore((state) => state.setStructureData);
  const tabId = tab?.id ?? null;
  const subView = tab?.subView ?? 'data';
  const connectionId = tab?.connectionId ?? null;
  const databaseName = tab?.databaseName ?? null;
  const schemaName = tab?.schemaName ?? null;
  const tableName = tab?.tableName ?? null;

  useEffect(() => {
    if (!tabId || subView === 'data' || !connectionId || !databaseName || !schemaName || !tableName) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setStructureLoading(tabId, true);
      setStructureError(tabId, null);

      try {
        const [columns, indexes, foreignKeys] = await Promise.all([
          wails.GetTableColumns(connectionId, databaseName, schemaName, tableName),
          wails.GetTableIndexes(connectionId, databaseName, schemaName, tableName),
          wails.GetTableForeignKeys(connectionId, databaseName, schemaName, tableName),
        ]);

        if (cancelled) {
          return;
        }

        setStructureData(tabId, columns, indexes, foreignKeys);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStructureLoading(tabId, false);
        setStructureError(tabId, String(error));
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [connectionId, databaseName, schemaName, setStructureData, setStructureError, setStructureLoading, subView, tabId, tableName]);

  return {
    structureLoading: tab?.structureLoading ?? false,
    structureError: tab?.structureError ?? null,
    tableColumns: tab?.tableColumns ?? EMPTY_COLUMNS,
    tableIndexes: tab?.tableIndexes ?? EMPTY_INDEXES,
    tableForeignKeys: tab?.tableForeignKeys ?? EMPTY_FOREIGN_KEYS,
  };
}
