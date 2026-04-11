import type { QueryResult } from '@/types';

interface QueryResultsPanelProps {
  result: QueryResult | null;
  loading: boolean;
  error: string | null;
}

export function QueryResultsPanel({ result, loading, error }: QueryResultsPanelProps) {
  if (loading) {
    return <div className="rounded-4xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">Running query...</div>;
  }

  if (error) {
    return <div className="rounded-4xl border bg-card p-5 text-sm text-destructive shadow-sm">{error}</div>;
  }

  if (!result) {
    return <div className="rounded-4xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">Run a query to see results here.</div>;
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 rounded-4xl border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
        <span>{result.rowsAffected} rows</span>
        <span>•</span>
        <span>{result.executionTimeMs} ms</span>
        <span>•</span>
        <span>{result.statementType}</span>
      </div>

      {result.columns.length === 0 ? (
        <div className="rounded-4xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">
          Query executed successfully without a row set.
        </div>
      ) : (
        <div className="overflow-hidden rounded-4xl border bg-card shadow-sm">
          <div className="overflow-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {result.columns.map((column) => (
                    <th key={column} className="border-b px-4 py-3 text-left font-medium text-foreground">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    {result.columns.map((column) => (
                      <td key={`${index}-${column}`} className="px-4 py-3 text-muted-foreground">{String(row[column] ?? 'NULL')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
