import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
      fontSize: '12px',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      border: 'none',
    },
  }), []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-auto rounded-3xl bg-muted/40 p-4">
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
      </DialogContent>
    </Dialog>
  );
}
