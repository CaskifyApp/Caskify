import { useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { CellRenderer } from '@/components/DataGrid/CellRenderer';
import { JSONViewerModal } from '@/components/Modals/JSONViewerModal';
import { Button } from '@/components/ui/button';
import type { DatabaseOperationResult, QueryResult } from '@/types';

interface QueryResultsPanelProps {
  result: QueryResult | null;
  loading: boolean;
  error: string | null;
}

export function QueryResultsPanel({ result, loading, error }: QueryResultsPanelProps) {
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [jsonViewerOpen, setJsonViewerOpen] = useState(false);
  const [jsonViewerValue, setJsonViewerValue] = useState<unknown>(null);

  if (loading) {
    return <div className="rounded-4xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">Running query and waiting for PostgreSQL response...</div>;
  }

  if (error) {
    return <div className="rounded-4xl border bg-card p-5 text-sm text-destructive shadow-sm">{error}</div>;
  }

  if (!result) {
    return <div className="rounded-4xl border border-dashed bg-card/80 p-5 text-sm text-muted-foreground shadow-sm">Run a query to see rows, execution time, and command feedback here.</div>;
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3 rounded-4xl border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
        <div className="flex items-center gap-2">
          <span>{result.truncated ? `${result.rowsAffected}+ preview rows` : `${result.rowsAffected} rows`}</span>
          <span>•</span>
          <span>{result.executionTimeMs} ms</span>
          <span>•</span>
          <span>{result.statementType}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const exportResult = await wails.ExportQueryResults('csv', result) as DatabaseOperationResult | null;
              if (exportResult) {
                setExportMessage(`CSV exported to ${exportResult.path}`);
              }
            }}
            disabled={result.columns.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const exportResult = await wails.ExportQueryResults('json', result) as DatabaseOperationResult | null;
              if (exportResult) {
                setExportMessage(`JSON exported to ${exportResult.path}`);
              }
            }}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {exportMessage ? (
        <div className="rounded-3xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {exportMessage}
        </div>
      ) : null}

      {result.truncated ? (
        <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-200">
          Query preview was capped at {result.previewRowLimit ?? result.rows.length} rows to keep the app responsive.
        </div>
      ) : null}

      {result.columns.length === 0 ? (
        <div className="rounded-4xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">
          Query executed successfully without a row set.
        </div>
      ) : (
        <div className="overflow-hidden rounded-4xl border bg-card shadow-sm [contain:layout_paint]">
          <div className="perf-scroll overflow-auto">
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
                      <td key={`${index}-${column}`} className="px-4 py-3 text-muted-foreground">
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
      )}

      <JSONViewerModal
        open={jsonViewerOpen}
        onOpenChange={setJsonViewerOpen}
        value={jsonViewerValue}
        title="Query Result JSON"
      />
    </div>
  );
}
