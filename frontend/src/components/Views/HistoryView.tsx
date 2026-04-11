import { useEffect, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
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

  useEffect(() => {
    if (!open) {
      return;
    }

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Query History</DialogTitle>
        </DialogHeader>

        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <div className="perf-scroll grid gap-3 max-h-[70vh] overflow-auto [contain:layout_paint]">
          {loading ? (
            <div className="flex items-center gap-2 rounded-4xl border bg-card p-5 text-sm text-muted-foreground">
              <Spinner />
              <span>Loading query history...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-4xl border bg-card p-5 text-sm text-muted-foreground">No history yet.</div>
          ) : entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="rounded-3xl border bg-card px-4 py-3 text-left"
              onClick={() => onSelectQuery(entry.query)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-foreground">{entry.database}</div>
                <div className="text-xs text-muted-foreground">{entry.exec_time_ms} ms</div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{entry.timestamp}</div>
              <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">{entry.query}</div>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={async () => {
              await wails.ClearQueryHistory();
              setEntries([]);
            }}
          >
            Clear History
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
