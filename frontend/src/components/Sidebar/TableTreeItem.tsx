import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Database, Eye, FolderPlus, FolderTree, Pencil, Table2, TableProperties, Trash2 } from 'lucide-react';
import { CreateSchemaDialog, DropSchemaDialog } from '@/components/Modals/DatabaseAdminDialogs';
import { CreateTableDialog, DropTableDialog, RenameTableDialog } from '@/components/Modals/TableAdminDialogs';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/sidebarStore';
import type { TreeNode } from '@/types';

interface TableTreeItemProps {
  node: TreeNode;
  depth?: number;
  onTableSelect?: (node: TreeNode) => void;
  onRequestDropDatabase?: (databaseName: string) => void;
}

function getNodeIcon(node: TreeNode) {
  switch (node.type) {
    case 'database':
      return Database;
    case 'schema':
      return FolderTree;
    case 'table':
      return Table2;
    case 'view':
      return Eye;
    default:
      return ChevronRight;
  }
}

function getNodeColor(node: TreeNode) {
  switch (node.type) {
    case 'database':
      return 'text-teal-400';
    case 'schema':
      return 'text-amber-400';
    case 'table':
      return 'text-slate-300';
    case 'view':
      return 'text-violet-400';
    default:
      return 'text-muted-foreground';
  }
}

export function TableTreeItem({ node, depth = 0, onTableSelect, onRequestDropDatabase }: TableTreeItemProps) {
  const toggleNode = useSidebarStore((state) => state.toggleNode);
  const loadSchemas = useSidebarStore((state) => state.loadSchemas);
  const loadTables = useSidebarStore((state) => state.loadTables);
  const Icon = getNodeIcon(node);
  const iconColor = getNodeColor(node);
  const hasChildren = node.type !== 'table' && node.type !== 'view';
  const isSystemDatabase = node.type === 'database' && (node.database === 'postgres');
  const isSystemSchema = node.type === 'schema' && (!!node.schema && (node.schema === 'information_schema' || node.schema.startsWith('pg_')));
  const [createSchemaOpen, setCreateSchemaOpen] = useState(false);
  const [dropSchemaOpen, setDropSchemaOpen] = useState(false);
  const [createTableOpen, setCreateTableOpen] = useState(false);
  const [renameTableOpen, setRenameTableOpen] = useState(false);
  const [dropTableOpen, setDropTableOpen] = useState(false);

  const handleClick = async () => {
    if (node.type === 'table' || node.type === 'view') {
      onTableSelect?.(node);
      return;
    }

    await toggleNode(node);
  };

  return (
    <li className="group flex flex-col gap-0.5">
      <Button
        variant="ghost"
        className="h-6 justify-start gap-1.5 rounded-md px-1.5 text-[11px] hover:bg-accent"
        onClick={() => void handleClick()}
        style={{ paddingLeft: `${depth * 10 + 6}px` }}
        title={node.label}
      >
        {hasChildren ? (
          <ChevronRight
            className={cn('size-2.5 shrink-0 text-muted-foreground transition-transform duration-150', node.expanded && 'rotate-90')}
          />
        ) : (
          <span className="size-2.5 shrink-0" />
        )}
        <Icon className={cn('size-3 shrink-0', iconColor)} />
        <span className="truncate">{node.label}</span>
        {node.loading && <Spinner className="ml-auto size-3" />}
        {!node.loading && node.type === 'database' ? (
          <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
            <Button variant="toolbar" size="icon-xs" title="Create schema" onClick={(event) => { event.stopPropagation(); setCreateSchemaOpen(true); }}>
              <FolderPlus className="size-2.5" />
            </Button>
            <Button variant="toolbar" size="icon-xs" title="Drop database" disabled={isSystemDatabase} onClick={(event) => { event.stopPropagation(); if (node.database) onRequestDropDatabase?.(node.database); }}>
              <Trash2 className="size-2.5 text-rose-400" />
            </Button>
          </div>
        ) : null}
        {!node.loading && node.type === 'schema' ? (
          <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
            <Button variant="toolbar" size="icon-xs" title="Create table" onClick={(event) => { event.stopPropagation(); setCreateTableOpen(true); }}>
              <TableProperties className="size-2.5" />
            </Button>
            <Button variant="toolbar" size="icon-xs" title="Drop schema" disabled={isSystemSchema} onClick={(event) => { event.stopPropagation(); setDropSchemaOpen(true); }}>
              <Trash2 className="size-2.5 text-rose-400" />
            </Button>
          </div>
        ) : null}
        {!node.loading && node.type === 'table' ? (
          <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
            <Button variant="toolbar" size="icon-xs" title="Rename table" onClick={(event) => { event.stopPropagation(); setRenameTableOpen(true); }}>
              <Pencil className="size-2.5" />
            </Button>
            <Button variant="toolbar" size="icon-xs" title="Drop table" onClick={(event) => { event.stopPropagation(); setDropTableOpen(true); }}>
              <Trash2 className="size-2.5 text-rose-400" />
            </Button>
          </div>
        ) : null}
      </Button>

      {node.error ? (
        <div
          className="px-1.5 text-[10px] text-rose-400"
          style={{ paddingLeft: `${depth * 10 + 24}px` }}
        >
          {node.error}
        </div>
      ) : null}

      <AnimatePresence initial={false}>
        {node.expanded && node.children?.length ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <ul className="flex flex-col gap-0.5">
              {node.children.map((child) => (
                <TableTreeItem key={child.id} node={child} depth={depth + 1} onTableSelect={onTableSelect} onRequestDropDatabase={onRequestDropDatabase} />
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {node.type === 'database' && node.database ? (
        <CreateSchemaDialog
          open={createSchemaOpen}
          onOpenChange={setCreateSchemaOpen}
          profileId={node.connectionId}
          databaseName={node.database}
          onSuccess={() => void loadSchemas(node.connectionId, node.database!, true)}
        />
      ) : null}

      {node.type === 'schema' && node.database && node.schema ? (
        <DropSchemaDialog
          open={dropSchemaOpen}
          onOpenChange={setDropSchemaOpen}
          profileId={node.connectionId}
          databaseName={node.database}
          schemaName={node.schema}
          onSuccess={() => void loadSchemas(node.connectionId, node.database!, true)}
        />
      ) : null}

      {node.type === 'schema' && node.database && node.schema ? (
        <CreateTableDialog
          open={createTableOpen}
          onOpenChange={setCreateTableOpen}
          profileId={node.connectionId}
          databaseName={node.database}
          schemaName={node.schema}
          onSuccess={() => void loadTables(node.connectionId, node.database!, node.schema!, true)}
        />
      ) : null}

      {node.type === 'table' && node.database && node.schema ? (
        <RenameTableDialog
          open={renameTableOpen}
          onOpenChange={setRenameTableOpen}
          profileId={node.connectionId}
          databaseName={node.database}
          schemaName={node.schema}
          tableName={node.label}
          onSuccess={() => void loadTables(node.connectionId, node.database!, node.schema!, true)}
        />
      ) : null}

      {node.type === 'table' && node.database && node.schema ? (
        <DropTableDialog
          open={dropTableOpen}
          onOpenChange={setDropTableOpen}
          profileId={node.connectionId}
          databaseName={node.database}
          schemaName={node.schema}
          tableName={node.label}
          onSuccess={() => void loadTables(node.connectionId, node.database!, node.schema!, true)}
        />
      ) : null}
    </li>
  );
}
