import { autocompletion, completeFromList } from '@codemirror/autocomplete';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { EditorView } from '@codemirror/view';
import { useMemo, useRef } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  completionItems?: string[];
}

function toggleLineComment(view: EditorView) {
  const { state } = view;
  const changes: { from: number; to: number; insert: string }[] = [];

  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from).number;
    const endLine = state.doc.lineAt(range.to).number;
    const lines = [];

    for (let lineNumber = startLine; lineNumber <= endLine; lineNumber += 1) {
      lines.push(state.doc.line(lineNumber));
    }

    const shouldUncomment = lines.every((line) => /^\s*-- ?/.test(line.text));
    for (const line of lines) {
      if (shouldUncomment) {
        const match = line.text.match(/^(\s*)-- ?/);
        if (match) {
          changes.push({
            from: line.from + match[1].length,
            to: line.from + match[0].length,
            insert: '',
          });
        }
      } else {
        const indentLength = line.text.match(/^\s*/)?.[0].length ?? 0;
        changes.push({
          from: line.from + indentLength,
          to: line.from + indentLength,
          insert: '-- ',
        });
      }
    }
  }

  if (changes.length > 0) {
    view.dispatch({
      changes,
    });
  }
}

export function QueryEditor({ value, onChange, onRun, completionItems = [] }: QueryEditorProps) {
  const theme = useSettingsStore((state) => state.settings.theme);
  const editorFontSize = useSettingsStore((state) => state.settings.editorFontSize);
  const editorViewRef = useRef<EditorView | null>(null);
  const editorTheme = useMemo(() => {
    const fontSize = editorFontSize || 14;
    if (theme === 'dark') {
      return EditorView.theme({
        '&': {
          backgroundColor: 'oklch(0.218 0.008 223.9)',
          color: 'oklch(0.987 0.002 197.1)',
          fontSize: `${fontSize}px`,
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
        fontSize: `${fontSize}px`,
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
  }, [theme, editorFontSize]);

  const completionExtension = useMemo(() => autocompletion({
    override: [completeFromList(completionItems.map((label) => ({ label, type: 'keyword' })))],
  }), [completionItems]);

  return (
    <div className="query-editor overflow-hidden rounded-4xl border bg-card shadow-sm">
      <CodeMirror
        value={value}
        height="320px"
        extensions={[sql(), completionExtension, editorTheme]}
        onChange={onChange}
        onCreateEditor={(view) => {
          editorViewRef.current = view;
        }}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            onRun();
          }

          if ((event.ctrlKey || event.metaKey) && event.key === '/') {
            event.preventDefault();
            if (editorViewRef.current) {
              toggleLineComment(editorViewRef.current);
            }
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
