import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface DangerousQueryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  command: string;
  onConfirm: () => void;
}

export function DangerousQueryDialog({ open, onOpenChange, command, onConfirm }: DangerousQueryDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const requiredConfirmation = 'EXECUTE';
  const isConfirmed = confirmText === requiredConfirmation;

  useEffect(() => {
    if (open) {
      setConfirmText('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Dangerous Query Detected
          </DialogTitle>
          <DialogDescription>
            This query contains a potentially destructive command: <strong>{command}</strong>.
            This action may result in data loss and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <label className="text-sm font-medium">
            Type <span className="font-mono text-destructive">{requiredConfirmation}</span> to confirm:
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={requiredConfirmation}
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={!isConfirmed}>
            Execute Query
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
