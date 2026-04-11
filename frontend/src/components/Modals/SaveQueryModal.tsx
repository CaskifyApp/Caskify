import { useEffect, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
          setFolders(payload.folders ?? []);
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
        const nextFolder = payload.folders.find((item) => item.name === folder.name);
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Save Query</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Query Name</label>
            <Input value={queryName} onChange={(event) => setQueryName(event.target.value)} />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Folder</label>
            <Select value={selectedFolderId} onValueChange={(value) => setSelectedFolderId(value ?? '')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose folder" />
              </SelectTrigger>
              <SelectContent>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">New Folder</label>
            <Input value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} placeholder="Optional new folder name" />
          </div>

          {error ? <div className="text-sm text-destructive">{error}</div> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Close</Button>
          <Button onClick={() => void handleSave()} disabled={saving || !queryText.trim()}>{saving ? 'Saving...' : 'Save Query'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
