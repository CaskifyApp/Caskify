import { create } from 'zustand';
import * as wails from '../../wailsjs/go/main/App';
import type { DatabaseInfo, SchemaInfo, TableInfo, TreeNode } from '@/types';

const CACHE_TTL_MS = 60_000;

interface SidebarState {
  treeByConnection: Record<string, TreeNode[]>;
  expandedNodeIds: Record<string, boolean>;
  loadingNodeIds: Record<string, boolean>;
  errorByNodeId: Record<string, string | null>;
  loadedAtByNodeId: Record<string, number>;
  loadDatabases: (connectionId: string, force?: boolean) => Promise<void>;
  loadSchemas: (connectionId: string, databaseName: string, force?: boolean) => Promise<void>;
  loadTables: (connectionId: string, databaseName: string, schemaName: string, force?: boolean) => Promise<void>;
  toggleNode: (node: TreeNode) => Promise<void>;
  setConnectionTree: (connectionId: string, nodes: TreeNode[]) => void;
  resetConnectionTree: (connectionId: string) => void;
  getConnectionTree: (connectionId: string) => TreeNode[];
}

function getDatabaseNodeId(connectionId: string, databaseName: string) {
  return `${connectionId}:database:${databaseName}`;
}

function getSchemaNodeId(connectionId: string, databaseName: string, schemaName: string) {
  return `${connectionId}:schema:${databaseName}:${schemaName}`;
}

function mapDatabaseNode(database: DatabaseInfo): TreeNode {
  return {
    id: getDatabaseNodeId(database.connectionId, database.name),
    label: database.name,
    type: 'database',
    connectionId: database.connectionId,
    database: database.name,
    children: [],
    expanded: false,
    loading: false,
    error: null,
  };
}

function mapSchemaNode(schema: SchemaInfo): TreeNode {
  return {
    id: getSchemaNodeId(schema.connectionId, schema.database, schema.name),
    label: schema.name,
    type: 'schema',
    connectionId: schema.connectionId,
    database: schema.database,
    schema: schema.name,
    children: [],
    expanded: false,
    loading: false,
    error: null,
  };
}

function mapTableNode(table: Omit<TableInfo, 'kind'> & { kind?: string }): TreeNode {
  const relationKind = table.kind === 'view' ? 'view' : 'table';
  const normalizedTable: TableInfo = {
    ...table,
    kind: relationKind,
  };

  return {
    id: `${table.connectionId}:${relationKind}:${table.database}:${table.schema}:${table.name}`,
    label: table.name,
    type: relationKind,
    connectionId: table.connectionId,
    database: table.database,
    schema: table.schema,
    metadata: normalizedTable,
    expanded: false,
    loading: false,
    error: null,
  };
}

function updateTreeNodes(nodes: TreeNode[], nodeId: string, updater: (node: TreeNode) => TreeNode): TreeNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return updater(node);
    }

    if (!node.children?.length) {
      return node;
    }

    return {
      ...node,
      children: updateTreeNodes(node.children, nodeId, updater),
    };
  });
}

function isFresh(timestamp?: number) {
  return typeof timestamp === 'number' && Date.now() - timestamp < CACHE_TTL_MS;
}

function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  treeByConnection: {},
  expandedNodeIds: {},
  loadingNodeIds: {},
  errorByNodeId: {},
  loadedAtByNodeId: {},

  loadDatabases: async (connectionId, force = false) => {
    const cacheKey = `${connectionId}:databases`;
    const { loadedAtByNodeId, treeByConnection } = get();
    if (!force && treeByConnection[connectionId]?.length && isFresh(loadedAtByNodeId[cacheKey])) {
      return;
    }

    set((state) => ({
      loadingNodeIds: { ...state.loadingNodeIds, [cacheKey]: true },
      errorByNodeId: { ...state.errorByNodeId, [cacheKey]: null },
    }));

    try {
      const databases = await wails.GetDatabases(connectionId);
      const nextDatabases = ensureArray(databases);
      set((state) => ({
        treeByConnection: {
          ...state.treeByConnection,
          [connectionId]: nextDatabases.map(mapDatabaseNode),
        },
        loadedAtByNodeId: { ...state.loadedAtByNodeId, [cacheKey]: Date.now() },
        loadingNodeIds: { ...state.loadingNodeIds, [cacheKey]: false },
      }));
    } catch (error) {
      set((state) => ({
        loadingNodeIds: { ...state.loadingNodeIds, [cacheKey]: false },
        errorByNodeId: { ...state.errorByNodeId, [cacheKey]: String(error) },
      }));
      throw error;
    }
  },

  loadSchemas: async (connectionId, databaseName, force = false) => {
    const nodeId = getDatabaseNodeId(connectionId, databaseName);
    const { loadedAtByNodeId } = get();
    if (!force && isFresh(loadedAtByNodeId[nodeId])) {
      return;
    }

    set((state) => ({
      loadingNodeIds: { ...state.loadingNodeIds, [nodeId]: true },
      errorByNodeId: { ...state.errorByNodeId, [nodeId]: null },
      treeByConnection: {
        ...state.treeByConnection,
        [connectionId]: updateTreeNodes(state.treeByConnection[connectionId] ?? [], nodeId, (node) => ({
          ...node,
          loading: true,
          error: null,
        })),
      },
    }));

    try {
      const schemas = await wails.GetSchemas(connectionId, databaseName);
      const nextSchemas = ensureArray(schemas);
      set((state) => ({
        treeByConnection: {
          ...state.treeByConnection,
          [connectionId]: updateTreeNodes(state.treeByConnection[connectionId] ?? [], nodeId, (node) => ({
            ...node,
            loading: false,
            children: nextSchemas.map(mapSchemaNode),
          })),
        },
        loadedAtByNodeId: { ...state.loadedAtByNodeId, [nodeId]: Date.now() },
        loadingNodeIds: { ...state.loadingNodeIds, [nodeId]: false },
      }));
    } catch (error) {
      set((state) => ({
        treeByConnection: {
          ...state.treeByConnection,
          [connectionId]: updateTreeNodes(state.treeByConnection[connectionId] ?? [], nodeId, (node) => ({
            ...node,
            loading: false,
            error: String(error),
          })),
        },
        loadingNodeIds: { ...state.loadingNodeIds, [nodeId]: false },
        errorByNodeId: { ...state.errorByNodeId, [nodeId]: String(error) },
      }));
      throw error;
    }
  },

  loadTables: async (connectionId, databaseName, schemaName, force = false) => {
    const nodeId = getSchemaNodeId(connectionId, databaseName, schemaName);
    const { loadedAtByNodeId } = get();
    if (!force && isFresh(loadedAtByNodeId[nodeId])) {
      return;
    }

    set((state) => ({
      loadingNodeIds: { ...state.loadingNodeIds, [nodeId]: true },
      errorByNodeId: { ...state.errorByNodeId, [nodeId]: null },
      treeByConnection: {
        ...state.treeByConnection,
        [connectionId]: updateTreeNodes(state.treeByConnection[connectionId] ?? [], nodeId, (node) => ({
          ...node,
          loading: true,
          error: null,
        })),
      },
    }));

    try {
      const tables = await wails.GetTables(connectionId, databaseName, schemaName);
      const nextTables = ensureArray(tables);
      set((state) => ({
        treeByConnection: {
          ...state.treeByConnection,
          [connectionId]: updateTreeNodes(state.treeByConnection[connectionId] ?? [], nodeId, (node) => ({
            ...node,
            loading: false,
            children: nextTables.map(mapTableNode),
          })),
        },
        loadedAtByNodeId: { ...state.loadedAtByNodeId, [nodeId]: Date.now() },
        loadingNodeIds: { ...state.loadingNodeIds, [nodeId]: false },
      }));
    } catch (error) {
      set((state) => ({
        treeByConnection: {
          ...state.treeByConnection,
          [connectionId]: updateTreeNodes(state.treeByConnection[connectionId] ?? [], nodeId, (node) => ({
            ...node,
            loading: false,
            error: String(error),
          })),
        },
        loadingNodeIds: { ...state.loadingNodeIds, [nodeId]: false },
        errorByNodeId: { ...state.errorByNodeId, [nodeId]: String(error) },
      }));
      throw error;
    }
  },

  toggleNode: async (node) => {
    const nextExpanded = !get().expandedNodeIds[node.id];

    set((state) => ({
      expandedNodeIds: { ...state.expandedNodeIds, [node.id]: nextExpanded },
      treeByConnection: {
        ...state.treeByConnection,
        [node.connectionId]: updateTreeNodes(state.treeByConnection[node.connectionId] ?? [], node.id, (currentNode) => ({
          ...currentNode,
          expanded: nextExpanded,
        })),
      },
    }));

    if (!nextExpanded) {
      return;
    }

    if (node.type === 'database' && node.database) {
      await get().loadSchemas(node.connectionId, node.database);
    }

    if (node.type === 'schema' && node.database && node.schema) {
      await get().loadTables(node.connectionId, node.database, node.schema);
    }
  },

  setConnectionTree: (connectionId, nodes) => {
    set((state) => ({
      treeByConnection: {
        ...state.treeByConnection,
        [connectionId]: nodes,
      },
    }));
  },

  resetConnectionTree: (connectionId) => {
    set((state) => {
      const nextTreeByConnection = { ...state.treeByConnection };
      delete nextTreeByConnection[connectionId];

      const nextExpandedNodeIds = Object.fromEntries(
        Object.entries(state.expandedNodeIds).filter(([key]) => !key.startsWith(`${connectionId}:`)),
      );

      const nextLoadingNodeIds = Object.fromEntries(
        Object.entries(state.loadingNodeIds).filter(([key]) => !key.startsWith(`${connectionId}:`)),
      );

      const nextErrorByNodeId = Object.fromEntries(
        Object.entries(state.errorByNodeId).filter(([key]) => !key.startsWith(`${connectionId}:`)),
      );

      const nextLoadedAtByNodeId = Object.fromEntries(
        Object.entries(state.loadedAtByNodeId).filter(([key]) => !key.startsWith(`${connectionId}:`)),
      );

      return {
        treeByConnection: nextTreeByConnection,
        expandedNodeIds: nextExpandedNodeIds,
        loadingNodeIds: nextLoadingNodeIds,
        errorByNodeId: nextErrorByNodeId,
        loadedAtByNodeId: nextLoadedAtByNodeId,
      };
    });
  },

  getConnectionTree: (connectionId) => {
    return get().treeByConnection[connectionId] ?? [];
  },
}));
