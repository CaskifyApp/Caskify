import { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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

const ROW_HEIGHT = 40;
const OVERSCAN = 5;

export function DataGrid({ data, loading, error, sortColumn, sortDir, onSort, selectedRowIndex, onRowSelect }: DataGridProps) {
  const [jsonViewerOpen, setJsonViewerOpen] = useState(false);
  const [jsonViewerValue, setJsonViewerValue] = useState<unknown>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data?.rows.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

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

  const virtualRows = rowVirtualizer.getVirtualItems() as { index: number; key: string; size: number; start: number; end: number; lane: number }[];

  return (
    <>
      <div className="overflow-hidden rounded-4xl border bg-card shadow-sm [contain:layout_paint]">
        <div ref={parentRef} className="perf-scroll overflow-auto" style={{ maxHeight: '600px' }}>
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/40">
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
            <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              {virtualRows.map((virtualRow) => {
                const index = virtualRow.index;
                const row = data.rows[index];
                return (
                  <tr
                    key={`${data.table}-${index}`}
                    className={`border-b ${selectedRowIndex === index ? 'bg-primary/5' : ''}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
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
                );
              })}
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
