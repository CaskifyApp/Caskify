import type { ColumnDef, ForeignKeyInfo } from '@/types';

interface TableStructureViewProps {
  columns: ColumnDef[];
  foreignKeys: ForeignKeyInfo[];
  loading: boolean;
  error: string | null;
}

export function TableStructureView({ columns, foreignKeys, loading, error }: TableStructureViewProps) {
  if (loading) {
    return <div className="rounded-4xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">Loading table structure...</div>;
  }

  if (error) {
    return <div className="rounded-4xl border bg-card p-5 text-sm text-destructive shadow-sm">{error}</div>;
  }

  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-4xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3 text-sm font-medium">Columns</div>
        {columns.length === 0 ? (
          <div className="px-4 py-5 text-sm text-muted-foreground">No column metadata found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="border-b px-4 py-3 text-left font-medium">#</th>
                  <th className="border-b px-4 py-3 text-left font-medium">Name</th>
                  <th className="border-b px-4 py-3 text-left font-medium">Type</th>
                  <th className="border-b px-4 py-3 text-left font-medium">Nullable</th>
                  <th className="border-b px-4 py-3 text-left font-medium">Default</th>
                  <th className="border-b px-4 py-3 text-left font-medium">Primary Key</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((column) => (
                  <tr key={column.name} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-muted-foreground">{column.ordinalPosition}</td>
                    <td className="px-4 py-3 text-foreground">{column.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{column.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{column.isNullable ? 'YES' : 'NO'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{column.defaultVal ?? 'NULL'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{column.isPrimaryKey ? 'YES' : 'NO'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-4xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3 text-sm font-medium">Foreign Keys</div>
        {foreignKeys.length === 0 ? (
          <div className="px-4 py-5 text-sm text-muted-foreground">No foreign key relations found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="border-b px-4 py-3 text-left font-medium">Constraint</th>
                  <th className="border-b px-4 py-3 text-left font-medium">Column</th>
                  <th className="border-b px-4 py-3 text-left font-medium">References</th>
                  <th className="border-b px-4 py-3 text-left font-medium">Update Rule</th>
                  <th className="border-b px-4 py-3 text-left font-medium">Delete Rule</th>
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
                    <td className="px-4 py-3 text-muted-foreground">{foreignKey.updateRule}</td>
                    <td className="px-4 py-3 text-muted-foreground">{foreignKey.deleteRule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
