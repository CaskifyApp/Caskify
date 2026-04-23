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
  flat?: boolean;
}

export function DatabaseTree({ connectionId, connected, selectedDatabaseName, onTableSelect, onRequestDropDatabase, flat }: DatabaseTreeProps) {
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

  const isFlat = flat && nodes.length === 1 && nodes[0].type === 'database';
  const displayNodes = isFlat ? (nodes[0].children || []) : nodes;

  if (loading && displayNodes.length === 0) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-muted-foreground">
        <Spinner className="size-3" />
        <span>Loading...</span>
      </div>
    );
  }

  if (error) {
    return <div className="px-2 py-1 text-[11px] text-rose-400">{error}</div>;
  }

  if (displayNodes.length === 0) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-muted-foreground">
        <FolderSearch className="size-3" />
        <span>{isFlat ? 'No schemas found.' : 'No databases found.'}</span>
      </div>
    );
  }

  return (
    <ul className="mt-1 flex flex-col gap-0.5">
      {displayNodes.map((node) => (
        <TableTreeItem key={node.id} node={node} onTableSelect={onTableSelect} onRequestDropDatabase={onRequestDropDatabase} />
      ))}
    </ul>
  );
}
