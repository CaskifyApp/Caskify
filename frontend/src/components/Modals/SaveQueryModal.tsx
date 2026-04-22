import { useEffect, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileCode, FolderPlus } from 'lucide-react';
import type { QueryFolder, SavedQueriesPayload } from '@/types';

interface SaveQueryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queryText: string;
}

export function SaveQueryModal({ open, onOpenChange, queryText }: SaveQueryModalProps) {
  const [queryName, setQueryName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [folders, setFolders] = useState<QueryFolder[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const loadFolders = async () => {
      try {
        const payload = (await wails.GetSavedQueries()) as SavedQueriesPayload;
        if (!cancelled) {
          setFolders(payload?.folders ?? []);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(String(nextError));
        }
      }
    };

    setError(null);
    setQueryName('');
    setSelectedFolderId('');
    setNewFolderName('');
    void loadFolders();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSave = async () => {
    if (!queryName.trim()) {
      setError('Query name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let folderId = selectedFolderId;
      if (newFolderName.trim()) {
        const folder = { id: '', name: newFolderName.trim() };
        await wails.SaveQueryFolder(folder);
        const payload = (await wails.GetSavedQueries()) as SavedQueriesPayload;
        const nextFolder = payload?.folders?.find((item) => item.name === folder.name);
        folderId = nextFolder?.id ?? '';
      }

      await wails.SaveSavedQuery({
        id: '',
        name: queryName.trim(),
        query: queryText,
        folderId,
      });

      onOpenChange(false);
    } catch (nextError) {
      setError(String(nextError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="h-1 w-full bg-primary" />
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <FileCode className="size-4 text-primary" />
            <DialogTitle>Save Query</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-5 py-2 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Query Name</label>
            <Input value={queryName} onChange={(event) => setQueryName(event.target.value)} placeholder="Untitled Query" className="h-8 text-sm" autoFocus />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Folder</label>
            <Select value={selectedFolderId} onValueChange={(value) => setSelectedFolderId(value ?? '')}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="No folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No folder</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              <span className="flex items-center gap-1.5">
                <FolderPlus className="size-3" />
                New Folder
              </span>
            </label>
            <Input 
              value={newFolderName} 
              onChange={(event) => setNewFolderName(event.target.value)} 
              placeholder="Optional new folder name" 
              className="h-8 text-sm"
            />
          </div>

          {error ? <div className="text-xs text-rose-400">{error}</div> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>Close</Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={saving || !queryText.trim()}>{saving ? 'Saving...' : 'Save Query'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}