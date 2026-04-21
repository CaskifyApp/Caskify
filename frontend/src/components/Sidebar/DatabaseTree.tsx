import { useEffect } from 'react';
import { FolderSearch } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useSidebarStore } from '@/store/sidebarStore';
import { TableTreeItem } from '@/components/Sidebar/TableTreeItem';
import type { TreeNode } from '@/types';

const EMPTY_TREE: TreeNode[] = [];

interface DatabaseTreeProps {
  connectionId: string;
  connected: boolean;
  selectedDatabaseName?: string;
  onTableSelect?: (node: TreeNode) => void;
  onRequestDropDatabase?: (databaseName: string) => void;
}

export function DatabaseTree({ connectionId, connected, selectedDatabaseName, onTableSelect, onRequestDropDatabase }: DatabaseTreeProps) {
  const tree = useSidebarStore((state) => state.treeByConnection[connectionId]);
  const cacheKey = selectedDatabaseName ? `${connectionId}:scoped:${selectedDatabaseName}` : `${connectionId}:databases`;
  const loading = useSidebarStore((state) => state.loadingNodeIds[cacheKey] ?? false);
  const error = useSidebarStore((state) => state.errorByNodeId[cacheKey] ?? null);
  const loadDatabases = useSidebarStore((state) => state.loadDatabases);
  const loadScopedDatabase = useSidebarStore((state) => state.loadScopedDatabase);
  const nodes = tree ?? EMPTY_TREE;

  useEffect(() => {
    if (!connected) {
      return;
    }

    if (selectedDatabaseName) {
      void loadScopedDatabase(connectionId, selectedDatabaseName);
      return;
    }

    void loadDatabases(connectionId);
  }, [connected, connectionId, loadDatabases, loadScopedDatabase, selectedDatabaseName]);

  if (!connected) {
    return null;
  }

  if (loading && nodes.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
        <Spinner className="size-3.5" />
        <span>Loading databases...</span>
      </div>
    );
  }

  if (error) {
    return <div className="px-3 py-2 text-xs text-destructive">{error}</div>;
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
        <FolderSearch className="size-3.5" />
        <span>No databases found.</span>
      </div>
    );
  }

  return (
    <ul className="mt-2 flex flex-col gap-1">
      {nodes.map((node) => (
        <TableTreeItem key={node.id} node={node} onTableSelect={onTableSelect} onRequestDropDatabase={onRequestDropDatabase} />
      ))}
    </ul>
  );
}
