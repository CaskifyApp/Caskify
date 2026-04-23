import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import * as wails from '../../../wailsjs/go/main/App';
import { CellRenderer } from '@/components/DataGrid/CellRenderer';
import { JSONViewerModal } from '@/components/Modals/JSONViewerModal';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Download } from 'lucide-react';
import type { DatabaseOperationResult, QueryResult } from '@/types';

interface QueryResultsPanelProps {
  result: QueryResult | null;
  loading: boolean;
  error: string | null;
}

const panelVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const panelTransition = { duration: 0.18, ease: [0, 0, 0.2, 1] as const };

export function QueryResultsPanel({ result, loading, error }: QueryResultsPanelProps) {
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [jsonViewerOpen, setJsonViewerOpen] = useState(false);
  const [jsonViewerValue, setJsonViewerValue] = useState<unknown>(null);

  return (
    <div className="flex h-full flex-col bg-background">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={panelVariants.initial}
            animate={panelVariants.animate}
            exit={panelVariants.exit}
            transition={panelTransition}
            className="flex h-32 items-center justify-center text-sm text-muted-foreground"
          >
            Running query and waiting for PostgreSQL response...
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={panelVariants.initial}
            animate={panelVariants.animate}
            exit={panelVariants.exit}
            transition={panelTransition}
            className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400"
          >
            {error}
          </motion.div>
        ) : !result ? (
          <motion.div
            key="empty"
            initial={panelVariants.initial}
            animate={panelVariants.animate}
            exit={panelVariants.exit}
            transition={panelTransition}
            className="flex h-32 items-center justify-center text-sm text-muted-foreground/50"
          >
            Run a query to see rows, execution time, and command feedback here.
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={panelVariants.initial}
            animate={panelVariants.animate}
            exit={panelVariants.exit}
            transition={panelTransition}
            className="flex h-full flex-col"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border/20 bg-background px-3 py-1.5">
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{result.truncated ? `${result.rowsAffected}+ rows` : `${result.rowsAffected} rows`}</span>
                <span className="text-muted-foreground/30">•</span>
                <span>{result.executionTimeMs} ms</span>
                <span className="text-muted-foreground/30">•</span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{result.statementType}</span>
              </div>

              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={async () => {
                        const exportResult = await wails.ExportQueryResults('csv', result) as DatabaseOperationResult | null;
                        if (exportResult) {
                          setExportMessage(`CSV exported to ${exportResult.path}`);
                        }
                      }}
                      disabled={result.columns.length === 0}
                    >
                      <Download className="size-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export CSV</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <AnimatePresence>
              {exportMessage && (
                <motion.div
                  key="export"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] as const }}
                  className="overflow-hidden"
                >
                  <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 px-3 py-2 text-xs text-teal-400">
                    {exportMessage}
                  </div>
                </motion.div>
              )}

              {result.truncated && (
                <motion.div
                  key="truncated"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] as const }}
                  className="overflow-hidden"
                >
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
                    Query preview capped at {result.previewRowLimit ?? result.rows.length} rows to keep the app responsive.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {result.columns.length === 0 ? (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground/50">
                Query executed successfully without a row set.
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-hidden">
                <div className="h-full overflow-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-10 bg-muted/95">
                      <tr>
                        <th className="sticky left-0 z-20 w-10 border-b border-r border-border/10 bg-muted/30 px-2 py-2 text-center text-[10px] font-medium text-muted-foreground/50">#</th>
                        {result.columns.map((column) => (
                          <th key={column} className="border-b border-border/10 px-3 py-2 text-left text-xs font-medium text-foreground">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, index) => {
                        const isEven = index % 2 === 0;
                        return (
                          <tr key={index} className={isEven ? 'bg-muted/30' : ''}>
                            <td className="sticky left-0 z-10 border-r border-border/5 bg-background px-2 py-1.5 text-center text-[10px] font-mono text-muted-foreground/40">
                              {index + 1}
                            </td>
                            {result.columns.map((column) => (
                              <td key={`${index}-${column}`} className="border-b border-border/5 px-3 py-1.5 align-middle">
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
            )}

            <JSONViewerModal
              open={jsonViewerOpen}
              onOpenChange={setJsonViewerOpen}
              value={jsonViewerValue}
              title="Query Result JSON"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
