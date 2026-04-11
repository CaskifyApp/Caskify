import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ColumnDef } from '@/types';

interface RowEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnDef[];
  row: Record<string, unknown> | null;
  mode: 'insert' | 'edit';
}

export function RowEditorModal({ open, onOpenChange, columns, row, mode }: RowEditorModalProps) {
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextDraft: Record<string, string> = {};
    for (const column of columns) {
      const value = row?.[column.name];
      nextDraft[column.name] = value === null || value === undefined ? '' : String(value);
    }
    setDraft(nextDraft);
  }, [columns, open, row]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'insert' ? 'Insert Row' : 'Edit Row'}</DialogTitle>
          <DialogDescription>
            Row actions are wired up at the UI level. Persistence will be connected in the next implementation step.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[60vh] gap-4 overflow-auto pr-1">
          {columns.map((column) => (
            <div key={column.name} className="grid gap-2">
              <label className="text-sm font-medium text-foreground">{column.name}</label>
              <Input
                value={draft[column.name] ?? ''}
                onChange={(event) => setDraft((current) => ({
                  ...current,
                  [column.name]: event.target.value,
                }))}
              />
            </div>
          ))}
        </div>

        <DialogFooter className="sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button disabled>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
