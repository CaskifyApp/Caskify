import { Key, Hash, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TableIndexInfo } from '@/types';

interface TableIndexesViewProps {
  indexes: TableIndexInfo[];
  loading: boolean;
  error: string | null;
}

export function TableIndexesView({ indexes, loading, error }: TableIndexesViewProps) {
  if (loading) {
    return <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Loading table indexes...</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400">{error}</div>;
  }

  if (indexes.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No indexes found.</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/10 bg-background">
      <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted/30 backdrop-blur-sm">
            <tr>
              <th className="border-b border-border/10 px-3 py-2 text-left text-[10px] font-medium text-muted-foreground/50">Name</th>
              <th className="border-b border-border/10 px-3 py-2 text-left text-[10px] font-medium text-muted-foreground/50">Columns</th>
              <th className="border-b border-border/10 px-3 py-2 text-left text-[10px] font-medium text-muted-foreground/50">Type</th>
              <th className="border-b border-border/10 px-3 py-2 text-left text-[10px] font-medium text-muted-foreground/50">Flags</th>
            </tr>
          </thead>
          <tbody>
            {indexes.map((index, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <tr key={index.name} className={cn(isEven && 'bg-muted/30', 'hover:bg-muted/50 transition-colors')}>
                  <td className="border-b border-border/5 px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      {index.isPrimary ? (
                        <Key className="size-3 text-amber-400" />
                      ) : index.isUnique ? (
                        <Layers className="size-3 text-violet-400" />
                      ) : (
                        <Hash className="size-3 text-muted-foreground/40" />
                      )}
                      <span className="font-mono text-[11px] text-foreground/80">{index.name}</span>
                    </div>
                  </td>
                  <td className="border-b border-border/5 px-3 py-1.5">
                    <span className="font-mono text-[11px] text-muted-foreground/60">{index.columns.join(', ')}</span>
                  </td>
                  <td className="border-b border-border/5 px-3 py-1.5">
                    <span className="rounded border border-border/10 bg-muted/20 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      {index.type}
                    </span>
                  </td>
                  <td className="border-b border-border/5 px-3 py-1.5">
                    <div className="flex items-center gap-1">
                      {index.isPrimary && (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">PRIMARY</span>
                      )}
                      {index.isUnique && !index.isPrimary && (
                        <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-violet-400">UNIQUE</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
