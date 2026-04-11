import type { TableIndexInfo } from '@/types';

interface TableIndexesViewProps {
  indexes: TableIndexInfo[];
  loading: boolean;
  error: string | null;
}

export function TableIndexesView({ indexes, loading, error }: TableIndexesViewProps) {
  if (loading) {
    return <div className="rounded-4xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">Loading table indexes...</div>;
  }

  if (error) {
    return <div className="rounded-4xl border bg-card p-5 text-sm text-destructive shadow-sm">{error}</div>;
  }

  if (indexes.length === 0) {
    return <div className="rounded-4xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">No indexes found.</div>;
  }

  return (
    <div className="overflow-hidden rounded-4xl border bg-card shadow-sm">
      <div className="perf-scroll overflow-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="border-b px-4 py-3 text-left font-medium">Name</th>
              <th className="border-b px-4 py-3 text-left font-medium">Columns</th>
              <th className="border-b px-4 py-3 text-left font-medium">Type</th>
              <th className="border-b px-4 py-3 text-left font-medium">Unique</th>
              <th className="border-b px-4 py-3 text-left font-medium">Primary</th>
            </tr>
          </thead>
          <tbody>
            {indexes.map((index) => (
              <tr key={index.name} className="border-b last:border-b-0">
                <td className="px-4 py-3 text-foreground">{index.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{index.columns.join(', ')}</td>
                <td className="px-4 py-3 text-muted-foreground">{index.type}</td>
                <td className="px-4 py-3 text-muted-foreground">{index.isUnique ? 'YES' : 'NO'}</td>
                <td className="px-4 py-3 text-muted-foreground">{index.isPrimary ? 'YES' : 'NO'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
