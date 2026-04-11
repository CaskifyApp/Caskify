import type { ForeignKeyInfo } from '@/types';

interface TableForeignKeysViewProps {
  foreignKeys: ForeignKeyInfo[];
  loading: boolean;
  error: string | null;
}

export function TableForeignKeysView({ foreignKeys, loading, error }: TableForeignKeysViewProps) {
  if (loading) {
    return <div className="rounded-4xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">Loading foreign keys...</div>;
  }

  if (error) {
    return <div className="rounded-4xl border bg-card p-5 text-sm text-destructive shadow-sm">{error}</div>;
  }

  if (foreignKeys.length === 0) {
    return <div className="rounded-4xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">No foreign keys found.</div>;
  }

  return (
    <div className="overflow-hidden rounded-4xl border bg-card shadow-sm">
      <div className="perf-scroll overflow-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="border-b px-4 py-3 text-left font-medium">Constraint</th>
              <th className="border-b px-4 py-3 text-left font-medium">Column</th>
              <th className="border-b px-4 py-3 text-left font-medium">References</th>
            </tr>
          </thead>
          <tbody>
            {foreignKeys.map((foreignKey) => (
              <tr key={`${foreignKey.constraintName}:${foreignKey.columnName}`} className="border-b last:border-b-0">
                <td className="px-4 py-3 text-foreground">{foreignKey.constraintName}</td>
                <td className="px-4 py-3 text-muted-foreground">{foreignKey.columnName}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {foreignKey.referencedSchema}.{foreignKey.referencedTable}.{foreignKey.referencedColumn}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
