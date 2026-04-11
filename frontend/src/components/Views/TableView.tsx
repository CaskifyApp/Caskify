import { TableProperties } from 'lucide-react';
import type { Tab } from '@/types';

interface TableViewProps {
  tab: Tab;
}

export function TableView({ tab }: TableViewProps) {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="rounded-4xl border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <TableProperties className="size-5" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{tab.schemaName}.{tab.tableName}</h2>
            <p className="text-sm text-muted-foreground">
              Connected to {tab.databaseName} via profile {tab.connectionId}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-4xl border border-dashed bg-card/80 p-5 text-sm text-muted-foreground shadow-sm">
        Table workspace is ready. The data grid, structure tabs, and row actions will be implemented in the next phase.
      </div>
    </div>
  );
}
