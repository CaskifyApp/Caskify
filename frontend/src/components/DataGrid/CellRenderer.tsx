interface CellRendererProps {
  value: unknown;
  onOpenJson: (value: unknown) => void;
}

function isJsonLike(value: unknown) {
  return value !== null && typeof value === 'object';
}

export function CellRenderer({ value, onOpenJson }: CellRendererProps) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">NULL</span>;
  }

  if (typeof value === 'boolean') {
    return <span>{value ? 'true' : 'false'}</span>;
  }

  if (isJsonLike(value)) {
    return (
      <button
        type="button"
        className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
        onClick={() => onOpenJson(value)}
      >
        View JSON
      </button>
    );
  }

  return <span>{String(value)}</span>;
}
