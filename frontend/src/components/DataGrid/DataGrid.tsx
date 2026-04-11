import type { TablePageResult } from '@/types';

interface DataGridProps {
  data: TablePageResult | null;
  loading: boolean;
  error: string | null;
}

export function DataGrid({ data, loading, error }: DataGridProps) {
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
    <div className="overflow-hidden rounded-4xl border bg-card shadow-sm">
      <div className="overflow-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-muted/40">
            <tr>
              {data.columns.map((column) => (
                <th key={column} className="border-b px-4 py-3 text-left font-medium text-foreground">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, index) => (
              <tr key={`${data.table}-${index}`} className="border-b last:border-b-0">
                {data.columns.map((column) => (
                  <td key={`${index}-${column}`} className="px-4 py-3 align-top text-muted-foreground">
                    {String(row[column] ?? 'NULL')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
