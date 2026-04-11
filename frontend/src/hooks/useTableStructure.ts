import { useEffect } from 'react';
import * as wails from '../../wailsjs/go/main/App';
import { useTabStore } from '@/store/tabStore';
import type { Tab } from '@/types';

export function useTableStructure(tab: Tab | null) {
  const setStructureLoading = useTabStore((state) => state.setStructureLoading);
  const setStructureError = useTabStore((state) => state.setStructureError);
  const setStructureData = useTabStore((state) => state.setStructureData);

  useEffect(() => {
    if (!tab || tab.subView === 'data' || !tab.connectionId || !tab.schemaName || !tab.tableName) {
      return;
    }

    const connectionId = tab.connectionId;
    const schemaName = tab.schemaName;
    const tableName = tab.tableName;

    let cancelled = false;

    const load = async () => {
      setStructureLoading(tab.id, true);
      setStructureError(tab.id, null);

      try {
        const [columns, indexes, foreignKeys] = await Promise.all([
          wails.GetTableColumns(connectionId, schemaName, tableName),
          wails.GetTableIndexes(connectionId, schemaName, tableName),
          wails.GetTableForeignKeys(connectionId, schemaName, tableName),
        ]);

        if (cancelled) {
          return;
        }

        setStructureData(tab.id, columns, indexes, foreignKeys);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStructureLoading(tab.id, false);
        setStructureError(tab.id, String(error));
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [setStructureData, setStructureError, setStructureLoading, tab]);

  return {
    structureLoading: tab?.structureLoading ?? false,
    structureError: tab?.structureError ?? null,
    tableColumns: tab?.tableColumns ?? [],
    tableIndexes: tab?.tableIndexes ?? [],
    tableForeignKeys: tab?.tableForeignKeys ?? [],
  };
}
