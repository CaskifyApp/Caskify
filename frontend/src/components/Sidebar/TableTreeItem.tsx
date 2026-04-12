import { useState } from 'react';
import { ChevronRight, Database, FolderPlus, FolderTree, Pencil, Table2, TableProperties, Trash2 } from 'lucide-react';
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
    default:
      return ChevronRight;
  }
}

export function TableTreeItem({ node, depth = 0, onTableSelect, onRequestDropDatabase }: TableTreeItemProps) {
  const toggleNode = useSidebarStore((state) => state.toggleNode);
  const loadSchemas = useSidebarStore((state) => state.loadSchemas);
  const loadTables = useSidebarStore((state) => state.loadTables);
  const Icon = getNodeIcon(node);
  const hasChildren = node.type !== 'table';
  const isSystemDatabase = node.type === 'database' && (node.database === 'postgres');
  const isSystemSchema = node.type === 'schema' && (!!node.schema && (node.schema === 'information_schema' || node.schema.startsWith('pg_')));
  const [createSchemaOpen, setCreateSchemaOpen] = useState(false);
  const [dropSchemaOpen, setDropSchemaOpen] = useState(false);
  const [createTableOpen, setCreateTableOpen] = useState(false);
  const [renameTableOpen, setRenameTableOpen] = useState(false);
  const [dropTableOpen, setDropTableOpen] = useState(false);

  const handleClick = async () => {
    if (node.type === 'table') {
      onTableSelect?.(node);
      return;
    }

    await toggleNode(node);
  };

  return (
    <li className="group flex flex-col gap-1">
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
        {!node.loading && node.type === 'database' ? (
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <Button variant="ghost" size="icon-xs" title="Create schema" onClick={(event) => { event.stopPropagation(); setCreateSchemaOpen(true); }}>
              <FolderPlus className="size-3" />
            </Button>
            <Button variant="ghost" size="icon-xs" title="Drop database" disabled={isSystemDatabase} onClick={(event) => { event.stopPropagation(); if (node.database) onRequestDropDatabase?.(node.database); }}>
              <Trash2 className="size-3 text-destructive" />
            </Button>
          </div>
        ) : null}
        {!node.loading && node.type === 'schema' ? (
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <Button variant="ghost" size="icon-xs" title="Create table" onClick={(event) => { event.stopPropagation(); setCreateTableOpen(true); }}>
              <TableProperties className="size-3" />
            </Button>
            <Button variant="ghost" size="icon-xs" title="Drop schema" disabled={isSystemSchema} onClick={(event) => { event.stopPropagation(); setDropSchemaOpen(true); }}>
              <Trash2 className="size-3 text-destructive" />
            </Button>
          </div>
        ) : null}
        {!node.loading && node.type === 'table' ? (
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <Button variant="ghost" size="icon-xs" title="Rename table" onClick={(event) => { event.stopPropagation(); setRenameTableOpen(true); }}>
              <Pencil className="size-3" />
            </Button>
            <Button variant="ghost" size="icon-xs" title="Drop table" onClick={(event) => { event.stopPropagation(); setDropTableOpen(true); }}>
              <Trash2 className="size-3 text-destructive" />
            </Button>
          </div>
        ) : null}
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
            <TableTreeItem key={child.id} node={child} depth={depth + 1} onTableSelect={onTableSelect} onRequestDropDatabase={onRequestDropDatabase} />
          ))}
        </ul>
      ) : null}

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
