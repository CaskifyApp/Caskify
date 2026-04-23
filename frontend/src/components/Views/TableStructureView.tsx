import { Key, Link, Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ColumnDef, ForeignKeyInfo } from '@/types';

interface TableStructureViewProps {
  columns: ColumnDef[];
  foreignKeys: ForeignKeyInfo[];
  loading: boolean;
  error: string | null;
  onAddColumn: () => void;
  onRenameColumn: (columnName: string) => void;
  onDropColumn: (columnName: string) => void;
}

function getTypeBadgeColor(type: string): string {
  const lower = type.toLowerCase();
  if (lower.includes('int') || lower.includes('serial')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  if (lower.includes('bool')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (lower.includes('text') || lower.includes('char') || lower.includes('varchar')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  if (lower.includes('timestamp') || lower.includes('date') || lower.includes('time')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  if (lower.includes('float') || lower.includes('double') || lower.includes('numeric') || lower.includes('decimal')) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  if (lower.includes('json')) return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
  if (lower.includes('uuid')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
  return 'bg-muted/20 text-muted-foreground border-border/10';
}

function formatType(type: string): string {
  return type.split('(')[0];
}

export function TableStructureView({ columns, foreignKeys, loading, error, onAddColumn, onRenameColumn, onDropColumn }: TableStructureViewProps) {
  if (loading) {
    return <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Loading table structure...</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>{columns.length} columns</span>
          <span className="text-muted-foreground/30">•</span>
          <span>{foreignKeys.length} foreign keys</span>
          <span className="text-muted-foreground/30">•</span>
          <span>{columns.filter((c) => c.isPrimaryKey).length} primary keys</span>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onAddColumn}>
          <Plus className="size-3 mr-1" />
          Add Column
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/10 bg-background">
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/30 backdrop-blur-sm">
              <tr>
                <th className="border-b border-border/10 px-3 py-2 text-left text-[10px] font-medium text-muted-foreground/50">#</th>
                <th className="border-b border-border/10 px-3 py-2 text-left text-[10px] font-medium text-muted-foreground/50">Name</th>
                <th className="border-b border-border/10 px-3 py-2 text-left text-[10px] font-medium text-muted-foreground/50">Type</th>
                <th className="border-b border-border/10 px-3 py-2 text-left text-[10px] font-medium text-muted-foreground/50">Nullable</th>
                <th className="border-b border-border/10 px-3 py-2 text-left text-[10px] font-medium text-muted-foreground/50">Default</th>
                <th className="border-b border-border/10 px-3 py-2 text-left text-[10px] font-medium text-muted-foreground/50">Flags</th>
                <th className="border-b border-border/10 px-3 py-2 text-right text-[10px] font-medium text-muted-foreground/50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {columns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No column metadata found.
                  </td>
                </tr>
              ) : (
                columns.map((column, index) => {
                  const isEven = index % 2 === 0;
                  const typeColor = getTypeBadgeColor(column.type);

                  return (
                    <tr
                      key={column.name}
                      className={cn(
                        'group transition-colors',
                        isEven && 'bg-muted/30',
                        'hover:bg-muted/50'
                      )}
                    >
                      <td className="border-b border-border/5 px-3 py-1.5 text-[10px] font-mono text-muted-foreground/40">
                        {column.ordinalPosition}
                      </td>
                      <td className="border-b border-border/5 px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          {column.isPrimaryKey && <Key className="size-3 text-amber-400" />}
                          <span className="text-xs font-medium text-foreground">{column.name}</span>
                        </div>
                      </td>
                      <td className="border-b border-border/5 px-3 py-1.5">
                        <span className={cn('inline-flex rounded border px-1.5 py-0.5 text-[10px] font-mono', typeColor)}>
                          {formatType(column.type)}
                        </span>
                      </td>
                      <td className="border-b border-border/5 px-3 py-1.5">
                        <span className={cn(
                          'text-[10px] font-medium',
                          column.isNullable ? 'text-muted-foreground/50' : 'text-foreground/70'
                        )}>
                          {column.isNullable ? 'YES' : 'NO'}
                        </span>
                      </td>
                      <td className="border-b border-border/5 px-3 py-1.5">
                        <span className="font-mono text-[11px] text-muted-foreground/60">
                          {column.defaultVal ?? '—'}
                        </span>
                      </td>
                      <td className="border-b border-border/5 px-3 py-1.5">
                        <div className="flex items-center gap-1">
                          {column.isPrimaryKey && (
                            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">PK</span>
                          )}
                          {column.isIdentity && (
                            <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-400">ID</span>
                          )}
                          {column.isGenerated && (
                            <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-violet-400">GEN</span>
                          )}
                        </div>
                      </td>
                      <td className="border-b border-border/5 px-3 py-1.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRenameColumn(column.name)}>
                            <Pencil className="size-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-400 hover:text-rose-300" onClick={() => onDropColumn(column.name)}>
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {foreignKeys.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border/10 bg-background">
          <div className="border-b border-border/10 px-3 py-2 text-[10px] font-medium text-muted-foreground/50">
            Foreign Keys
          </div>
          <div className="overflow-auto" style={{ maxHeight: '200px' }}>
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted/20">
                <tr>
                  <th className="border-b border-border/5 px-3 py-1.5 text-left text-[10px] font-medium text-muted-foreground/50">Constraint</th>
                  <th className="border-b border-border/5 px-3 py-1.5 text-left text-[10px] font-medium text-muted-foreground/50">Column</th>
                  <th className="border-b border-border/5 px-3 py-1.5 text-left text-[10px] font-medium text-muted-foreground/50">References</th>
                  <th className="border-b border-border/5 px-3 py-1.5 text-left text-[10px] font-medium text-muted-foreground/50">On Update</th>
                  <th className="border-b border-border/5 px-3 py-1.5 text-left text-[10px] font-medium text-muted-foreground/50">On Delete</th>
                </tr>
              </thead>
              <tbody>
                {foreignKeys.map((fk, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <tr key={`${fk.constraintName}:${fk.columnName}`} className={cn(isEven && 'bg-muted/30')}>
                      <td className="border-b border-border/5 px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <Link className="size-3 text-muted-foreground/40" />
                          <span className="font-mono text-[11px] text-foreground/70">{fk.constraintName}</span>
                        </div>
                      </td>
                      <td className="border-b border-border/5 px-3 py-1.5">
                        <span className="font-mono text-[11px] text-foreground/70">{fk.columnName}</span>
                      </td>
                      <td className="border-b border-border/5 px-3 py-1.5">
                        <span className="font-mono text-[11px] text-violet-400/70">
                          {fk.referencedSchema}.{fk.referencedTable}.{fk.referencedColumn}
                        </span>
                      </td>
                      <td className="border-b border-border/5 px-3 py-1.5">
                        <span className="text-[10px] text-muted-foreground/50">{fk.updateRule}</span>
                      </td>
                      <td className="border-b border-border/5 px-3 py-1.5">
                        <span className="text-[10px] text-muted-foreground/50">{fk.deleteRule}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
