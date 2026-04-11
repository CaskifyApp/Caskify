import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Tab } from '@/types';

interface TabItemProps {
  tab: Tab;
  active: boolean;
  onSelect: (tabId: string) => void;
  onClose: (tabId: string) => void;
}

export function TabItem({ tab, active, onSelect, onClose }: TabItemProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1 rounded-2xl border px-2 py-1 text-xs transition-colors',
        active ? 'border-border bg-background text-foreground' : 'border-transparent bg-transparent text-muted-foreground hover:bg-muted'
      )}
    >
      <button
        type="button"
        className="min-w-0 flex-1 truncate text-left"
        onClick={() => onSelect(tab.id)}
        title={tab.mode === 'table' ? `${tab.schemaName}.${tab.tableName}` : tab.title}
      >
        {tab.title}
      </button>
      <Button
        variant="ghost"
        size="icon-xs"
        className="shrink-0"
        onClick={() => onClose(tab.id)}
        title="Close tab"
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}
