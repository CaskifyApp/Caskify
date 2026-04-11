import { TableProperties } from 'lucide-react';
import { useState } from 'react';
import { DataGrid } from '@/components/DataGrid/DataGrid';
import { DataGridToolbar } from '@/components/DataGrid/DataGridToolbar';
import { useTableData } from '@/hooks/useTableData';
import { RowEditorModal } from '@/components/Modals/RowEditorModal';
import { Button } from '@/components/ui/button';
import { useTabStore } from '@/store/tabStore';
import type { Tab } from '@/types';

interface TableViewProps {
  tab: Tab;
}

export function TableView({ tab }: TableViewProps) {
  const { tableData, tableLoading, tableError } = useTableData(tab);
  const setTablePagination = useTabStore((state) => state.setTablePagination);
  const setTableSorting = useTabStore((state) => state.setTableSorting);
  const [rowEditorOpen, setRowEditorOpen] = useState(false);
  const [rowEditorMode, setRowEditorMode] = useState<'insert' | 'edit'>('edit');
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);

  const handleSort = (column: string) => {
    const nextDirection = tab.sortColumn === column && tab.sortDir === 'asc' ? 'desc' : 'asc';
    setTableSorting(tab.id, column, nextDirection);
  };

  const handleRefresh = () => {
    setTablePagination(tab.id, tab.pagination?.page ?? 1, tab.pagination?.limit ?? 50);
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
            onClick={() => {
              setRowEditorMode('insert');
              setSelectedRow(null);
              setRowEditorOpen(true);
            }}
          >
            Add Row
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!selectedRow}
            onClick={() => {
              setRowEditorMode('edit');
              setRowEditorOpen(true);
            }}
          >
            Edit Selected Row
          </Button>
        </div>
      </div>

      <DataGridToolbar
        page={tab.pagination?.page ?? 1}
        limit={tab.pagination?.limit ?? 50}
        totalRows={tableData?.totalRows ?? 0}
        loading={tableLoading}
        onPageChange={(page) => setTablePagination(tab.id, page, tab.pagination?.limit ?? 50)}
        onLimitChange={(limit) => setTablePagination(tab.id, 1, limit)}
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

      <RowEditorModal
        open={rowEditorOpen}
        onOpenChange={setRowEditorOpen}
        columns={tab.tableColumns ?? []}
        row={selectedRow}
        mode={rowEditorMode}
      />
    </div>
  );
}
