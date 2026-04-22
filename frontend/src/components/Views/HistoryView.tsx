import { useEffect, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetPanel } from '@/components/ui/sheet';
import { Clock, Trash2 } from 'lucide-react';
import type { QueryHistoryEntry } from '@/types';

interface HistoryViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectQuery: (query: string) => void;
}

export function HistoryView({ open, onOpenChange, onSelectQuery }: HistoryViewProps) {
  const [entries, setEntries] = useState<QueryHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const historyEntries = (await wails.GetQueryHistory()) as QueryHistoryEntry[];
        if (!cancelled) {
          setEntries(historyEntries ?? []);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(String(nextError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    setError(null);
    void load();

    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/5 bg-background px-5 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-medium tracking-tight">Query History</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-rose-400 hover:text-rose-300"
              onClick={async () => {
                try {
                  setClearing(true);
                  setError(null);
                  await wails.ClearQueryHistory();
                  setEntries([]);
                } catch (nextError) {
                  setError(String(nextError));
                } finally {
                  setClearing(false);
                }
              }}
              disabled={clearing || entries.length === 0}
              title="Clear History"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </SheetHeader>

        <SheetPanel className="flex flex-1 flex-col gap-3 px-5 py-4" scrollFade={false}>
          {error && <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-400">{error}</div>}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4 animate-spin" />
              <span>Loading query history...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground/50">No history yet.</div>
          ) : (
            entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="group rounded-lg border border-border/10 bg-white/[0.02] p-3 text-left transition-colors hover:bg-white/[0.04]"
                onClick={() => onSelectQuery(entry.query)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{entry.database}</span>
                    <span className="text-[10px] text-muted-foreground/40">{entry.timestamp}</span>
                  </div>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{entry.exec_time_ms} ms</span>
                </div>
                <div className="mt-2 line-clamp-2 font-mono text-[11px] text-muted-foreground/60">{entry.query}</div>
              </button>
            ))
          )}
        </SheetPanel>
      </SheetContent>
    </Sheet>
  );
}
