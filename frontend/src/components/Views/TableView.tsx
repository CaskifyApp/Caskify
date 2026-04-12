import { TableProperties } from 'lucide-react';
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
    if (!selectedRow) {
      return;
    }

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

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="rounded-4xl border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <TableProperties className="size-5" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{tab.schemaName}.{tab.tableName}</h2>
            <p className="text-sm text-muted-foreground">
              Connected to {tab.databaseName} via profile {tab.connectionId}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={tableLoading}
            onClick={() => {
              setRowEditorMode('insert');
              setSelectedRow(null);
              setSelectedRowIndex(null);
              setRowEditorOpen(true);
            }}
          >
            Add Row
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!selectedRow || tableLoading}
            onClick={() => {
              setRowEditorMode('edit');
              setRowEditorOpen(true);
            }}
          >
            Edit Selected Row
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!selectedRow || tableLoading}
            onClick={() => {
              setDeleteError(null);
              setDeleteDialogOpen(true);
            }}
          >
            Delete Selected Row
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button variant={tab.subView === 'data' ? 'default' : 'outline'} size="sm" onClick={() => setTableSubView(tab.id, 'data')}>
            Data
          </Button>
          <Button variant={tab.subView === 'structure' ? 'default' : 'outline'} size="sm" onClick={() => setTableSubView(tab.id, 'structure')}>
            Structure
          </Button>
          <Button variant={tab.subView === 'indexes' ? 'default' : 'outline'} size="sm" onClick={() => setTableSubView(tab.id, 'indexes')}>
            Indexes
          </Button>
        </div>
      </div>

      {tab.subView === 'data' ? (
        <>
            <DataGridToolbar
              page={tab.pagination?.page ?? 1}
              limit={tab.pagination?.limit ?? 50}
              totalRows={tableData?.totalRows ?? 0}
              estimated={tableData?.isEstimated ?? false}
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
            onRefresh={handleRefresh}
          />

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
          />
        </>
      ) : null}

      {tab.subView === 'structure' ? (
        <>
          <div className="flex items-center gap-2 rounded-4xl border bg-card px-4 py-3 shadow-sm">
            <Button variant="outline" size="sm" onClick={() => setCreateTableOpen(true)}>Create Table</Button>
            <Button variant="outline" size="sm" onClick={() => setRenameTableOpen(true)}>Rename Table</Button>
            <Button variant="outline" size="sm" onClick={() => setDropTableOpen(true)}>Drop Table</Button>
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
        </>
      ) : null}

      {tab.subView === 'indexes' ? (
        <TableIndexesView
          indexes={tableIndexes}
          loading={structureLoading}
          error={structureError}
        />
      ) : null}

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

          {deleteError ? <div className="text-sm text-destructive">{deleteError}</div> : null}

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
          refreshTableData(tab.id)
          refreshStructureData(tab.id)
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
          refreshTableData(tab.id)
          refreshStructureData(tab.id)
        }}
      />

      <RenameColumnDialog
        open={renameColumnTarget !== null}
        onOpenChange={(open) => { if (!open) setRenameColumnTarget(null) }}
        profileId={tab.connectionId}
        databaseName={tab.databaseName ?? ''}
        schemaName={tab.schemaName ?? ''}
        tableName={tab.tableName ?? ''}
        columnName={renameColumnTarget ?? ''}
        onSuccess={() => {
          setRenameColumnTarget(null)
          refreshTableData(tab.id)
          refreshStructureData(tab.id)
        }}
      />

      <DropColumnDialog
        open={dropColumnTarget !== null}
        onOpenChange={(open) => { if (!open) setDropColumnTarget(null) }}
        profileId={tab.connectionId}
        databaseName={tab.databaseName ?? ''}
        schemaName={tab.schemaName ?? ''}
        tableName={tab.tableName ?? ''}
        columnName={dropColumnTarget ?? ''}
        onSuccess={() => {
          setDropColumnTarget(null)
          refreshTableData(tab.id)
          refreshStructureData(tab.id)
        }}
      />
    </div>
  );
}
