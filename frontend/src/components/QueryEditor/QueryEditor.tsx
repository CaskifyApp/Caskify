import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { EditorView } from '@codemirror/view';
import { useMemo } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
}

export function QueryEditor({ value, onChange, onRun }: QueryEditorProps) {
  const theme = useSettingsStore((state) => state.settings.theme);
  const editorTheme = useMemo(() => {
    if (theme === 'dark') {
      return EditorView.theme({
        '&': {
          backgroundColor: 'oklch(0.218 0.008 223.9)',
          color: 'oklch(0.987 0.002 197.1)',
        },
        '.cm-content': {
          caretColor: 'oklch(0.987 0.002 197.1)',
        },
        '.cm-gutters': {
          backgroundColor: 'oklch(0.218 0.008 223.9)',
          color: 'oklch(0.723 0.014 214.4)',
          border: 'none',
        },
        '.cm-activeLine': {
          backgroundColor: 'oklch(0.275 0.011 216.9)',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'oklch(0.275 0.011 216.9)',
        },
        '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
          backgroundColor: 'oklch(0.45 0.085 224.283 / 0.35)',
        },
      }, { dark: true });
    }

    return EditorView.theme({
      '&': {
        backgroundColor: 'oklch(1 0 0)',
        color: 'oklch(0.148 0.004 228.8)',
      },
      '.cm-gutters': {
        backgroundColor: 'oklch(1 0 0)',
        color: 'oklch(0.56 0.021 213.5)',
        border: 'none',
      },
      '.cm-activeLine': {
        backgroundColor: 'oklch(0.963 0.002 197.1)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'oklch(0.963 0.002 197.1)',
      },
      '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
        backgroundColor: 'oklch(0.52 0.105 223.128 / 0.18)',
      },
    });
  }, [theme]);

  return (
    <div className="query-editor overflow-hidden rounded-4xl border bg-card shadow-sm">
      <CodeMirror
        value={value}
        height="320px"
        extensions={[sql(), editorTheme]}
        onChange={onChange}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            onRun();
          }
        }}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          autocompletion: true,
        }}
      />
    </div>
  );
}
