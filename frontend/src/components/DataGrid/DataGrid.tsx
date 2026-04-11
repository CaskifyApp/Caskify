import { useState } from 'react';
import { CellRenderer } from '@/components/DataGrid/CellRenderer';
import { JSONViewerModal } from '@/components/Modals/JSONViewerModal';
import type { TablePageResult } from '@/types';

interface DataGridProps {
  data: TablePageResult | null;
  loading: boolean;
  error: string | null;
  sortColumn?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  selectedRowIndex?: number | null;
  onRowSelect?: (rowIndex: number, row: Record<string, unknown>) => void;
}

export function DataGrid({ data, loading, error, sortColumn, sortDir, onSort, selectedRowIndex, onRowSelect }: DataGridProps) {
  const [jsonViewerOpen, setJsonViewerOpen] = useState(false);
  const [jsonViewerValue, setJsonViewerValue] = useState<unknown>(null);

  if (loading) {
    return (
      <div className="rounded-4xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">
        Loading table data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-4xl border bg-card p-5 text-sm text-destructive shadow-sm">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-4xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">
        Select a table to load its rows.
      </div>
    );
  }

  if (data.columns.length === 0) {
    return (
      <div className="rounded-4xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">
        This table has no columns to display.
      </div>
    );
  }

  if (data.rows.length === 0) {
    return (
      <div className="rounded-4xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">
        This table does not contain any rows yet.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-4xl border bg-card shadow-sm [contain:layout_paint]">
        <div className="perf-scroll overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-muted/40">
              <tr>
                {data.columns.map((column) => (
                  <th key={column} className="border-b px-4 py-3 text-left font-medium text-foreground">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2"
                      onClick={() => onSort?.(column)}
                    >
                      <span>{column}</span>
                      {sortColumn === column ? <span className="text-xs text-muted-foreground">{sortDir === 'desc' ? 'DESC' : 'ASC'}</span> : null}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, index) => (
                <tr
                  key={`${data.table}-${index}`}
                  className={`border-b last:border-b-0 ${selectedRowIndex === index ? 'bg-primary/5' : ''}`}
                  onClick={() => onRowSelect?.(index, row)}
                >
                  {data.columns.map((column) => (
                    <td key={`${index}-${column}`} className="px-4 py-3 align-top text-muted-foreground">
                      <CellRenderer
                        value={row[column]}
                        onOpenJson={(value) => {
                          setJsonViewerValue(value);
                          setJsonViewerOpen(true);
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <JSONViewerModal
        open={jsonViewerOpen}
        onOpenChange={setJsonViewerOpen}
        value={jsonViewerValue}
        title={`${data.schema}.${data.table}`}
      />
    </>
  );
}
