import { useEffect, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetPanel } from '@/components/ui/sheet';
import { FileCode, Trash2, Play } from 'lucide-react';
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
    if (!open) return;

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

  const folders = payload?.folders ?? [];
  const queries = payload?.queries ?? [];

  const folderMap = new Map(folders.map((folder) => [folder.id, folder.name]));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/5 bg-background px-5 py-4">
          <SheetTitle className="text-lg font-medium tracking-tight">Saved Queries</SheetTitle>
        </SheetHeader>

        <SheetPanel className="flex flex-1 flex-col gap-3 px-5 py-4" scrollFade={false}>
          {error && <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-400">{error}</div>}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileCode className="size-4 animate-spin" />
              <span>Loading saved queries...</span>
            </div>
          ) : queries.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground/50">No saved queries yet.</div>
          ) : (
            queries.map((savedQuery) => (
              <div
                key={savedQuery.id}
                className="group flex items-start justify-between gap-3 rounded-lg border border-border/10 bg-muted/40 p-3 transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{savedQuery.name}</span>
                    <span className="text-[10px] text-muted-foreground/40">{folderMap.get(savedQuery.folderId) ?? 'Ungrouped'}</span>
                  </div>
                  <div className="mt-1.5 line-clamp-2 font-mono text-[11px] text-muted-foreground/60">{savedQuery.query}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-400" onClick={() => onSelectQuery(savedQuery.query)} title="Use Query">
                    <Play className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-rose-400 hover:text-rose-300"
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
                    title="Delete"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </SheetPanel>
      </SheetContent>
    </Sheet>
  );
}
