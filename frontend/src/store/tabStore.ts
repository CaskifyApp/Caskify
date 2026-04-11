import { create } from 'zustand';
import type { Tab, TreeNode } from '@/types';

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
  openTableTab: (node: TreeNode) => void;
  setActiveTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
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
        pagination: { page: 1, limit: 50 },
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
}));
