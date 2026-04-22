import { TableProperties, Plus, Pencil, Trash2, Table2, Code, Layers } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { DataGrid } from '@/components/DataGrid/DataGrid';
import { DataGridToolbar } from '@/components/DataGrid/DataGridToolbar';
import { CreateTableDialog, DropTableDialog, RenameTableDialog } from '@/components/Modals/TableAdminDialogs';
import { AddColumnDialog, DropColumnDialog, RenameColumnDialog } from '@/components/Modals/ColumnAdminDialogs';
import { useTableData } from '@/hooks/useTableData';
import { useTableStructure } from '@/hooks/useTableStructure';
import { RowEditorModal } from '@/components/Modals/RowEditorModal';
import { TableIndexesView } from '@/components/Views/TableIndexesView';
import { TableStructureView } from '@/components/Views/TableStructureView';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTabStore } from '@/store/tabStore';
import type { DeleteRowParams } from '@/types';
import type { Tab } from '@/types';

interface TableViewProps {
  tab: Tab;
}

export function TableView({ tab }: TableViewProps) {
  const { tableData, tableLoading, tableError } = useTableData(tab);
  const { structureLoading, structureError, tableColumns, tableIndexes, tableForeignKeys } = useTableStructure(tab);
  const setTablePagination = useTabStore((state) => state.setTablePagination);
  const setTableSorting = useTabStore((state) => state.setTableSorting);
  const setTableFilter = useTabStore((state) => state.setTableFilter);
  const setTableSubView = useTabStore((state) => state.setTableSubView);
  const refreshTableData = useTabStore((state) => state.refreshTableData);
  const refreshStructureData = useTabStore((state) => state.refreshStructureData);
  const [rowEditorOpen, setRowEditorOpen] = useState(false);
  const [rowEditorMode, setRowEditorMode] = useState<'insert' | 'edit'>('edit');
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [createTableOpen, setCreateTableOpen] = useState(false);
  const [renameTableOpen, setRenameTableOpen] = useState(false);
  const [dropTableOpen, setDropTableOpen] = useState(false);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [renameColumnTarget, setRenameColumnTarget] = useState<string | null>(null);
  const [dropColumnTarget, setDropColumnTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!rowEditorOpen) {
      setSelectedRow(null);
      setSelectedRowIndex(null);
    }
  }, [rowEditorOpen]);

  useEffect(() => {
    if (!deleteDialogOpen) {
      setDeleteError(null);
    }
  }, [deleteDialogOpen]);

  const handleSort = (column: string) => {
    const nextDirection = tab.sortColumn === column && tab.sortDir === 'asc' ? 'desc' : 'asc';
    setSelectedRow(null);
    setSelectedRowIndex(null);
    setTableSorting(tab.id, column, nextDirection);
  };

  const handleRefresh = () => {
    setSelectedRow(null);
    setSelectedRowIndex(null);
    setTablePagination(tab.id, tab.pagination?.page ?? 1, tab.pagination?.limit ?? 50);
  };

  const handleDeleteRow = async () => {
    if (!selectedRow) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const payload: DeleteRowParams = {
        profileId: tab.connectionId,
        database: tab.databaseName ?? '',
        schema: tab.schemaName ?? '',
        table: tab.tableName ?? '',
        originalValues: selectedRow,
      };

      await wails.DeleteTableRow(payload);
      setDeleteDialogOpen(false);
      setSelectedRow(null);
      setSelectedRowIndex(null);
      refreshTableData(tab.id);
    } catch (error) {
      setDeleteError(String(error));
    } finally {
      setDeleteLoading(false);
    }
  };

  const subViewIcon = {
    data: <Table2 className="size-3.5" />,
    structure: <Code className="size-3.5" />,
    indexes: <Layers className="size-3.5" />,
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b border-border/10 bg-muted/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TableProperties className="size-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{tab.schemaName}.{tab.tableName}</h2>
            <p className="text-[11px] text-muted-foreground">
              {tab.databaseName} • {tab.connectionId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={tableLoading}
            onClick={() => {
              setRowEditorMode('insert');
              setSelectedRow(null);
              setSelectedRowIndex(null);
              setRowEditorOpen(true);
            }}
            title="Add Row"
          >
            <Plus className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!selectedRow || tableLoading}
            onClick={() => {
              setRowEditorMode('edit');
              setRowEditorOpen(true);
            }}
            title="Edit Selected Row"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-rose-400 hover:text-rose-300"
            disabled={!selectedRow || tableLoading}
            onClick={() => {
              setDeleteError(null);
              setDeleteDialogOpen(true);
            }}
            title="Delete Selected Row"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={tab.subView ?? 'data'} className="flex h-full flex-col" onValueChange={(v) => setTableSubView(tab.id, v as 'data' | 'structure' | 'indexes')}>
          <div className="border-b border-border/10 bg-muted/5 px-3">
            <TabsList className="h-8 bg-transparent p-0">
              <TabsTrigger value="data" className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">
                {subViewIcon.data} Data
              </TabsTrigger>
              <TabsTrigger value="structure" className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">
                {subViewIcon.structure} Structure
              </TabsTrigger>
              <TabsTrigger value="indexes" className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">
                {subViewIcon.indexes} Indexes
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="data" className="flex flex-1 flex-col overflow-hidden m-0">
            <DataGridToolbar
              page={tab.pagination?.page ?? 1}
              limit={tab.pagination?.limit ?? 50}
              totalRows={tableData?.totalRows ?? 0}
              estimated={tableData?.isEstimated ?? false}
              columns={tableData?.columns ?? []}
              filterColumn={tab.filterColumn}
              filterValue={tab.filterValue}
              loading={tableLoading}
              onPageChange={(page) => {
                setSelectedRow(null);
                setSelectedRowIndex(null);
                setTablePagination(tab.id, page, tab.pagination?.limit ?? 50);
              }}
              onLimitChange={(limit) => {
                setSelectedRow(null);
                setSelectedRowIndex(null);
                setTablePagination(tab.id, 1, limit);
              }}
              onFilterColumnChange={(column) => {
                setSelectedRow(null);
                setSelectedRowIndex(null);
                setTableFilter(tab.id, column, '');
              }}
              onFilterValueChange={(value) => {
                setSelectedRow(null);
                setSelectedRowIndex(null);
                setTableFilter(tab.id, tab.filterColumn ?? '', value);
              }}
              onRefresh={handleRefresh}
            />

            <div className="flex-1 overflow-auto p-3">
              <DataGrid
                data={tableData}
                loading={tableLoading}
                error={tableError}
                sortColumn={tab.sortColumn}
                sortDir={tab.sortDir}
                onSort={handleSort}
                selectedRowIndex={selectedRowIndex}
                onRowSelect={(rowIndex, row) => {
                  setSelectedRowIndex(rowIndex);
                  setSelectedRow(row);
                }}
                columns={tableColumns}
              />
            </div>

            {selectedRow !== null && (
              <div className="border-t border-border/10 bg-muted/10 px-4 py-1.5 text-[11px] text-muted-foreground">
                Selected row #{(selectedRowIndex ?? 0) + 1}
              </div>
            )}
          </TabsContent>

          <TabsContent value="structure" className="flex-1 overflow-auto m-0 p-3">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setCreateTableOpen(true)}>Create Table</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setRenameTableOpen(true)}>Rename Table</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs text-rose-400 hover:text-rose-300" onClick={() => setDropTableOpen(true)}>Drop Table</Button>
            </div>
            <TableStructureView
              columns={tableColumns}
              foreignKeys={tableForeignKeys}
              loading={structureLoading}
              error={structureError}
              onAddColumn={() => setAddColumnOpen(true)}
              onRenameColumn={(columnName) => setRenameColumnTarget(columnName)}
              onDropColumn={(columnName) => setDropColumnTarget(columnName)}
            />
          </TabsContent>

          <TabsContent value="indexes" className="flex-1 overflow-auto m-0 p-3">
            <TableIndexesView
              indexes={tableIndexes}
              loading={structureLoading}
              error={structureError}
            />
          </TabsContent>
        </Tabs>
      </div>

      <RowEditorModal
        open={rowEditorOpen}
        onOpenChange={setRowEditorOpen}
        columns={tableColumns}
        row={selectedRow}
        mode={rowEditorMode}
        profileId={tab.connectionId}
        database={tab.databaseName ?? ''}
        schema={tab.schemaName ?? ''}
        table={tab.tableName ?? ''}
        onSaved={() => {
          setSelectedRow(null);
          setSelectedRowIndex(null);
          refreshTableData(tab.id);
        }}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Row</DialogTitle>
            <DialogDescription>
              This will delete the selected row using its current field values as the match criteria.
            </DialogDescription>
          </DialogHeader>

          {deleteError && <div className="text-sm text-destructive">{deleteError}</div>}

          <DialogFooter className="sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button onClick={() => void handleDeleteRow()} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete Row'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateTableDialog
        open={createTableOpen}
        onOpenChange={setCreateTableOpen}
        profileId={tab.connectionId}
        databaseName={tab.databaseName ?? ''}
        schemaName={tab.schemaName ?? ''}
        onSuccess={() => refreshTableData(tab.id)}
      />

      <RenameTableDialog
        open={renameTableOpen}
        onOpenChange={setRenameTableOpen}
        profileId={tab.connectionId}
        databaseName={tab.databaseName ?? ''}
        schemaName={tab.schemaName ?? ''}
        tableName={tab.tableName ?? ''}
        onSuccess={() => refreshTableData(tab.id)}
      />

      <DropTableDialog
        open={dropTableOpen}
        onOpenChange={setDropTableOpen}
        profileId={tab.connectionId}
        databaseName={tab.databaseName ?? ''}
        schemaName={tab.schemaName ?? ''}
        tableName={tab.tableName ?? ''}
        onSuccess={() => {
          refreshTableData(tab.id);
          refreshStructureData(tab.id);
        }}
      />

      <AddColumnDialog
        open={addColumnOpen}
        onOpenChange={setAddColumnOpen}
        profileId={tab.connectionId}
        databaseName={tab.databaseName ?? ''}
        schemaName={tab.schemaName ?? ''}
        tableName={tab.tableName ?? ''}
        onSuccess={() => {
          refreshTableData(tab.id);
          refreshStructureData(tab.id);
        }}
      />

      <RenameColumnDialog
        open={renameColumnTarget !== null}
        onOpenChange={(open) => { if (!open) setRenameColumnTarget(null); }}
        profileId={tab.connectionId}
        databaseName={tab.databaseName ?? ''}
        schemaName={tab.schemaName ?? ''}
        tableName={tab.tableName ?? ''}
        columnName={renameColumnTarget ?? ''}
        onSuccess={() => {
          setRenameColumnTarget(null);
          refreshTableData(tab.id);
          refreshStructureData(tab.id);
        }}
      />

      <DropColumnDialog
        open={dropColumnTarget !== null}
        onOpenChange={(open) => { if (!open) setDropColumnTarget(null); }}
        profileId={tab.connectionId}
        databaseName={tab.databaseName ?? ''}
        schemaName={tab.schemaName ?? ''}
        tableName={tab.tableName ?? ''}
        columnName={dropColumnTarget ?? ''}
        onSuccess={() => {
          setDropColumnTarget(null);
          refreshTableData(tab.id);
          refreshStructureData(tab.id);
        }}
      />
    </div>
  );
}
