import { useEffect, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import type { SavedQueriesPayload } from '@/types';

interface SavedQueriesViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectQuery: (query: string) => void;
}

export function SavedQueriesView({ open, onOpenChange, onSelectQuery }: SavedQueriesViewProps) {
  const [payload, setPayload] = useState<SavedQueriesPayload>({ queries: [], folders: [] });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const savedQueries = (await wails.GetSavedQueries()) as SavedQueriesPayload;
        if (!cancelled) {
          setPayload(savedQueries);
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

  const folderMap = new Map(payload.folders.map((folder) => [folder.id, folder.name]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Saved Queries</DialogTitle>
        </DialogHeader>

        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <div className="perf-scroll grid gap-3 max-h-[70vh] overflow-auto [contain:layout_paint]">
          {loading ? (
            <div className="flex items-center gap-2 rounded-4xl border bg-card p-5 text-sm text-muted-foreground">
              <Spinner />
              <span>Loading saved queries...</span>
            </div>
          ) : payload.queries.length === 0 ? (
            <div className="rounded-4xl border bg-card p-5 text-sm text-muted-foreground">No saved queries yet.</div>
          ) : payload.queries.map((savedQuery) => (
            <div key={savedQuery.id} className="flex items-start justify-between gap-3 rounded-3xl border bg-card px-4 py-3">
              <div className="min-w-0">
                <div className="font-medium text-foreground">{savedQuery.name}</div>
                <div className="text-xs text-muted-foreground">{folderMap.get(savedQuery.folderId) ?? 'Ungrouped'}</div>
                <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">{savedQuery.query}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onSelectQuery(savedQuery.query)}>Use Query</Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      setDeletingId(savedQuery.id);
                      setError(null);
                      await wails.DeleteSavedQuery(savedQuery.id);
                      const savedQueries = (await wails.GetSavedQueries()) as SavedQueriesPayload;
                      setPayload(savedQueries);
                    } catch (nextError) {
                      setError(String(nextError));
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                  disabled={deletingId === savedQuery.id}
                >
                  {deletingId === savedQuery.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
