import { TableProperties } from 'lucide-react';
import { DataGrid } from '@/components/DataGrid/DataGrid';
import { DataGridToolbar } from '@/components/DataGrid/DataGridToolbar';
import { useTableData } from '@/hooks/useTableData';
import { useTabStore } from '@/store/tabStore';
import type { Tab } from '@/types';

interface TableViewProps {
  tab: Tab;
}

export function TableView({ tab }: TableViewProps) {
  const { tableData, tableLoading, tableError } = useTableData(tab);
  const setTablePagination = useTabStore((state) => state.setTablePagination);
  const setTableSorting = useTabStore((state) => state.setTableSorting);

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
      />
    </div>
  );
}
