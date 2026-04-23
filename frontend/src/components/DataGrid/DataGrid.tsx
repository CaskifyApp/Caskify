import { ArrowUpDown, ArrowUp, ArrowDown, Key } from 'lucide-react';
import { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CellRenderer } from '@/components/DataGrid/CellRenderer';
import { JSONViewerModal } from '@/components/Modals/JSONViewerModal';
import { cn } from '@/lib/utils';
import type { ColumnDef, TablePageResult } from '@/types';

interface DataGridProps {
  data: TablePageResult | null;
  loading: boolean;
  error: string | null;
  sortColumn?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  selectedRowIndex?: number | null;
  onRowSelect?: (rowIndex: number, row: Record<string, unknown>) => void;
  columns?: ColumnDef[];
}

const ROW_HEIGHT = 36;

function getColumnDisplayType(col?: ColumnDef): string {
  if (!col) return '';
  if (col.isPrimaryKey) return 'PK';
  if (col.isGenerated) return 'gen';
  if (col.isIdentity) return 'id';
  return '';
}

export function DataGrid({ data, loading, error, sortColumn, sortDir, onSort, selectedRowIndex, onRowSelect, columns }: DataGridProps) {
  const [jsonViewerOpen, setJsonViewerOpen] = useState(false);
  const [jsonViewerValue, setJsonViewerValue] = useState<unknown>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data?.rows.length ?? 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom = virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0;

  const getColumnDef = (colName: string): ColumnDef | undefined => {
    return columns?.find((c) => c.name === colName);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Loading table data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400">
        {error}
      </div>
    );
  }

  if (!data || data.columns.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        {data ? 'This table has no columns to display.' : 'Select a table to load its rows.'}
      </div>
    );
  }

  if (data.rows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        This table does not contain any rows yet.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border/10 bg-background">
        <div ref={scrollRef} className="overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/95">
              <tr>
                <th className="sticky left-0 z-20 w-10 border-b border-r border-border/10 bg-muted/95 px-2 py-2 text-center text-[10px] font-medium text-muted-foreground/50">
                  #
                </th>
                {data.columns.map((column) => {
                  const colDef = getColumnDef(column);
                  const displayType = getColumnDisplayType(colDef);
                  const isSorted = sortColumn === column;

                  return (
                    <th
                      key={column}
                      className={cn(
                        'group relative border-b border-border/10 px-3 py-2 text-left',
                        isSorted ? 'bg-muted/50' : ''
                      )}
                    >
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground transition-colors hover:text-primary"
                        onClick={() => onSort?.(column)}
                      >
                        <span className="max-w-32 truncate">{column}</span>
                        <span className="inline-flex items-center gap-0.5 text-muted-foreground/50">
                          {isSorted ? (
                            sortDir === 'desc' ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />
                          ) : (
                            <ArrowUpDown className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </span>
                      </button>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {colDef?.isPrimaryKey && (
                          <Key className="size-2.5 text-amber-400/60" />
                        )}
                        {displayType && (
                          <span className="text-[9px] font-mono text-muted-foreground/40">
                            {colDef?.type?.split('(')[0] || displayType}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paddingTop > 0 && (
                <tr>
                  <td colSpan={data.columns.length + 1} style={{ height: `${paddingTop}px` }} />
                </tr>
              )}
              {virtualRows.map((virtualRow) => {
                const index = virtualRow.index;
                const row = data.rows[index];
                const isSelected = selectedRowIndex === index;
                const isEven = index % 2 === 0;

                return (
                  <tr
                    key={`${data.table}-${index}`}
                    className={cn(
                      'group transition-colors',
                      isSelected && 'bg-primary/10',
                      !isSelected && isEven && 'bg-muted/30',
                      !isSelected && !isEven && 'bg-transparent',
                      'hover:bg-muted/50'
                    )}
                    onClick={() => onRowSelect?.(index, row)}
                  >
                    <td className="sticky left-0 z-10 border-r border-border/5 px-2 py-1.5 text-center text-[10px] font-mono text-muted-foreground/40 bg-background group-hover:bg-muted/50">
                      {index + 1}
                    </td>
                    {data.columns.map((column) => {
                      const colDef = getColumnDef(column);
                      return (
                        <td
                          key={`${index}-${column}`}
                          className={cn(
                            'border-b border-border/5 px-3 py-1.5 align-middle',
                            colDef?.isPrimaryKey && 'border-l-2 border-l-amber-400/30'
                          )}
                        >
                          <CellRenderer
                            value={row[column]}
                            columnType={colDef?.type}
                            onOpenJson={(value) => {
                              setJsonViewerValue(value);
                              setJsonViewerOpen(true);
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td colSpan={data.columns.length + 1} style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
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
