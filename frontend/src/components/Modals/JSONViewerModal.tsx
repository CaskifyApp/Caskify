import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileJson } from 'lucide-react';

interface JSONViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: unknown;
  title: string;
}

export function JSONViewerModal({ open, onOpenChange, value, title }: JSONViewerModalProps) {
  const formatted = JSON.stringify(value, null, 2);
  const readOnlyTheme = useMemo(() => EditorView.theme({
    '&': {
      backgroundColor: 'transparent',
      fontSize: '11px',
      fontFamily: 'monospace',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      border: 'none',
    },
    '.cm-content': {
      padding: '8px 0',
    },
  }), []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <div className="h-1 w-full bg-slate-500" />
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <FileJson className="size-4 text-slate-400" />
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-5 pb-5">
          <div className="max-h-[70vh] overflow-auto rounded-md border border-border/20 bg-muted/10 p-3">
            <CodeMirror
              value={formatted}
              height="60vh"
              editable={false}
              basicSetup={{
                lineNumbers: true,
                foldGutter: false,
              }}
              extensions={[EditorView.editable.of(false), readOnlyTheme]}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}