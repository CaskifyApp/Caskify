import { create } from 'zustand';
import { useConnectionStore } from '@/store/connectionStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { ColumnDef, ForeignKeyInfo, QueryResult, TableIndexInfo, TablePageResult, Tab, TreeNode } from '@/types';

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
  openTableTab: (node: TreeNode) => void;
  openQueryTab: () => void;
  setActiveTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  setTableLoading: (tabId: string, loading: boolean) => void;
  setTableError: (tabId: string, error: string | null) => void;
  setTableData: (tabId: string, tableData: TablePageResult, tableColumns: ColumnDef[]) => void;
  setTablePagination: (tabId: string, page: number, limit: number) => void;
  setTableSorting: (tabId: string, sortColumn?: string, sortDir?: 'asc' | 'desc') => void;
  refreshTableData: (tabId: string) => void;
  refreshStructureData: (tabId: string) => void;
  setTableSubView: (tabId: string, subView: 'data' | 'structure' | 'indexes') => void;
  setStructureLoading: (tabId: string, loading: boolean) => void;
  setStructureError: (tabId: string, error: string | null) => void;
  setStructureData: (tabId: string, columns: ColumnDef[], indexes: TableIndexInfo[], foreignKeys: ForeignKeyInfo[]) => void;
  setQueryText: (tabId: string, queryText: string) => void;
  setQueryProfile: (tabId: string, profileId: string) => void;
  setQueryDatabase: (tabId: string, databaseName: string) => void;
  setQueryLoading: (tabId: string, loading: boolean) => void;
  setQueryError: (tabId: string, error: string | null) => void;
  setQueryResult: (tabId: string, queryResult: QueryResult | null) => void;
}

function updateTab(tabs: Tab[], tabId: string, updater: (tab: Tab) => Tab) {
  return tabs.map((tab) => (tab.id === tabId ? updater(tab) : tab));
}

function buildTableTabId(node: TreeNode) {
  return `${node.connectionId}:${node.database}:${node.schema}:${node.label}`;
}

export const useTabStore = create<TabState>((set) => ({
  tabs: [],
  activeTabId: null,

  openTableTab: (node) => {
    if (node.type !== 'table' || !node.database || !node.schema) {
      return;
    }

    const nextId = buildTableTabId(node);

    set((state) => {
      const existingTab = state.tabs.find((tab) => tab.id === nextId);
      if (existingTab) {
        return {
          tabs: state.tabs,
          activeTabId: existingTab.id,
        };
      }

      const nextTab: Tab = {
        id: nextId,
        title: node.label,
        mode: 'table',
        connectionId: node.connectionId,
        databaseName: node.database,
        schemaName: node.schema,
        tableName: node.label,
        subView: 'data',
        pagination: {
          page: 1,
          limit: useSettingsStore.getState().settings.defaultRowsPerPage,
        },
        tableData: null,
        tableColumns: [],
        tableIndexes: [],
        tableForeignKeys: [],
        tableLoading: false,
        tableError: null,
        tableRefreshKey: 0,
        structureLoading: false,
        structureError: null,
        structureRefreshKey: 0,
      };

      return {
        tabs: [...state.tabs, nextTab],
        activeTabId: nextTab.id,
      };
    });
  },

  openQueryTab: () => {
    set((state) => {
      const queryIndex = state.tabs.filter((tab) => tab.mode === 'query').length + 1;
      const connectedProfile = useConnectionStore.getState().profiles.find(
        (profile) => useConnectionStore.getState().connectionStatuses.get(profile.id)?.connected,
      );
      const nextTab: Tab = {
        id: `query:${crypto.randomUUID()}`,
        title: `Query ${queryIndex}`,
        mode: 'query',
        connectionId: connectedProfile?.id ?? '',
        databaseName: connectedProfile?.defaultDatabase ?? connectedProfile?.database ?? '',
        queryText: '',
        queryResult: null,
        queryLoading: false,
        queryError: null,
      };

      return {
        tabs: [...state.tabs, nextTab],
        activeTabId: nextTab.id,
      };
    });
  },

  setActiveTab: (tabId) => {
    set({ activeTabId: tabId });
  },

  closeTab: (tabId) => {
    set((state) => {
      const nextTabs = state.tabs.filter((tab) => tab.id !== tabId);
      const nextActiveTabId = state.activeTabId === tabId
        ? nextTabs.at(-1)?.id ?? null
        : state.activeTabId;

      return {
        tabs: nextTabs,
        activeTabId: nextActiveTabId,
      };
    });
  },

  setTableLoading: (tabId, loading) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        tableLoading: loading,
      })),
    }));
  },

  setTableError: (tabId, error) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        tableError: error,
      })),
    }));
  },

  setTableData: (tabId, tableData, tableColumns) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        tableData,
        tableColumns,
        tableLoading: false,
        tableError: null,
      })),
    }));
  },

  setTablePagination: (tabId, page, limit) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        pagination: { page, limit },
      })),
    }));
  },

  setTableSorting: (tabId, sortColumn, sortDir) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        sortColumn,
        sortDir,
        pagination: {
          page: 1,
          limit: tab.pagination?.limit ?? 50,
        },
      })),
    }));
  },

  refreshTableData: (tabId) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        pagination: {
          page: tab.pagination?.page ?? 1,
          limit: tab.pagination?.limit ?? 50,
        },
        tableLoading: false,
        tableRefreshKey: (tab.tableRefreshKey ?? 0) + 1,
      })),
    }));
  },

  refreshStructureData: (tabId) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        structureRefreshKey: (tab.structureRefreshKey ?? 0) + 1,
      })),
    }));
  },

  setTableSubView: (tabId, subView) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        subView,
      })),
    }));
  },

  setStructureLoading: (tabId, loading) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        structureLoading: loading,
      })),
    }));
  },

  setStructureError: (tabId, error) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        structureError: error,
      })),
    }));
  },

  setStructureData: (tabId, columns, indexes, foreignKeys) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        tableColumns: columns,
        tableIndexes: indexes,
        tableForeignKeys: foreignKeys,
        structureLoading: false,
        structureError: null,
      })),
    }));
  },

  setQueryText: (tabId, queryText) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        queryText,
      })),
    }));
  },

  setQueryProfile: (tabId, profileId) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        connectionId: profileId,
        databaseName: '',
      })),
    }));
  },

  setQueryDatabase: (tabId, databaseName) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        databaseName,
      })),
    }));
  },

  setQueryLoading: (tabId, loading) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        queryLoading: loading,
      })),
    }));
  },

  setQueryError: (tabId, error) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        queryError: error,
      })),
    }));
  },

  setQueryResult: (tabId, queryResult) => {
    set((state) => ({
      tabs: updateTab(state.tabs, tabId, (tab) => ({
        ...tab,
        queryResult,
        queryLoading: false,
        queryError: null,
      })),
    }));
  },
}));
