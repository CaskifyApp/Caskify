import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
      <DialogContent className="max-w-sm">
        <div className="h-1 w-full bg-rose-500" />
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-rose-400" />
            <DialogTitle className="text-rose-400">Dangerous Query</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-5 py-2 space-y-3">
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            This query contains a destructive command: <span className="font-mono text-rose-400">{command}</span>.
            Data loss may occur and cannot be undone.
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Type <span className="font-mono text-rose-400">{requiredConfirmation}</span> to confirm
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={requiredConfirmation}
              autoComplete="off"
              className="h-8 text-sm"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={!isConfirmed}>
            Execute Query
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}