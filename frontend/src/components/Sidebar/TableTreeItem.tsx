import { ChevronRight, Database, FolderTree, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/sidebarStore';
import type { TreeNode } from '@/types';

interface TableTreeItemProps {
  node: TreeNode;
  depth?: number;
  onTableSelect?: (node: TreeNode) => void;
}

function getNodeIcon(node: TreeNode) {
  switch (node.type) {
    case 'database':
      return Database;
    case 'schema':
      return FolderTree;
    case 'table':
      return Table2;
    default:
      return ChevronRight;
  }
}

export function TableTreeItem({ node, depth = 0, onTableSelect }: TableTreeItemProps) {
  const toggleNode = useSidebarStore((state) => state.toggleNode);
  const Icon = getNodeIcon(node);
  const hasChildren = node.type !== 'table';

  const handleClick = async () => {
    if (node.type === 'table') {
      onTableSelect?.(node);
      return;
    }

    await toggleNode(node);
  };

  return (
    <li className="flex flex-col gap-1">
      <Button
        variant="ghost"
        className="h-8 justify-start gap-2 rounded-2xl px-2 text-xs"
        onClick={() => void handleClick()}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        title={node.label}
      >
        {hasChildren ? (
          <ChevronRight
            className={cn('size-3 shrink-0 text-muted-foreground transition-transform', node.expanded && 'rotate-90')}
          />
        ) : (
          <span className="size-3 shrink-0" />
        )}
        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{node.label}</span>
        {node.loading && <Spinner className="ml-auto size-3.5" />}
      </Button>

      {node.error ? (
        <div
          className="px-2 text-[11px] text-destructive"
          style={{ paddingLeft: `${depth * 12 + 28}px` }}
        >
          {node.error}
        </div>
      ) : null}

      {node.expanded && node.children?.length ? (
        <ul className="flex flex-col gap-1">
          {node.children.map((child) => (
            <TableTreeItem key={child.id} node={child} depth={depth + 1} onTableSelect={onTableSelect} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
