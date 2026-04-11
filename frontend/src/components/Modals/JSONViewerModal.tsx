import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface JSONViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: unknown;
  title: string;
}

export function JSONViewerModal({ open, onOpenChange, value, title }: JSONViewerModalProps) {
  const formatted = JSON.stringify(value, null, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <pre className="max-h-[70vh] overflow-auto rounded-3xl bg-muted/40 p-4 text-xs leading-6 text-foreground">
          {formatted}
        </pre>
      </DialogContent>
    </Dialog>
  );
}
