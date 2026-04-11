import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
}

export function QueryEditor({ value, onChange, onRun }: QueryEditorProps) {
  return (
    <div className="overflow-hidden rounded-4xl border bg-card shadow-sm">
      <CodeMirror
        value={value}
        height="320px"
        extensions={[sql()]}
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
