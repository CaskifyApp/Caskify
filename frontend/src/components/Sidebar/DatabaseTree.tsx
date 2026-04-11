import { useEffect } from 'react';
import { FolderSearch } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useSidebarStore } from '@/store/sidebarStore';
import { TableTreeItem } from '@/components/Sidebar/TableTreeItem';
import type { TreeNode } from '@/types';

interface DatabaseTreeProps {
  connectionId: string;
  connected: boolean;
  onTableSelect?: (node: TreeNode) => void;
}

export function DatabaseTree({ connectionId, connected, onTableSelect }: DatabaseTreeProps) {
  const tree = useSidebarStore((state) => state.treeByConnection[connectionId] ?? []);
  const loading = useSidebarStore((state) => state.loadingNodeIds[`${connectionId}:databases`] ?? false);
  const error = useSidebarStore((state) => state.errorByNodeId[`${connectionId}:databases`] ?? null);
  const loadDatabases = useSidebarStore((state) => state.loadDatabases);

  useEffect(() => {
    if (!connected) {
      return;
    }

    void loadDatabases(connectionId);
  }, [connected, connectionId, loadDatabases]);

  if (!connected) {
    return null;
  }

  if (loading && tree.length === 0) {
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

  if (tree.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
        <FolderSearch className="size-3.5" />
        <span>No databases found.</span>
      </div>
    );
  }

  return (
    <ul className="mt-2 flex flex-col gap-1">
      {tree.map((node) => (
        <TableTreeItem key={node.id} node={node} onTableSelect={onTableSelect} />
      ))}
    </ul>
  );
}
