import { memo, useMemo } from 'react';
import { X, Table2, FileCode } from 'lucide-react';
import { useConnectionStore } from '@/store/connectionStore';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Tab } from '@/types';

interface TabItemProps {
  tab: Tab;
  active: boolean;
  onSelect: (tabId: string) => void;
  onClose: (tabId: string) => void;
}

function getSourceColor(sourceKind: string | undefined) {
  switch (sourceKind) {
    case 'local': return 'border-teal-400';
    case 'docker': return 'border-amber-400';
    case 'cloud': return 'border-violet-400';
    default: return 'border-slate-400';
  }
}

function getSourceIconColor(sourceKind: string | undefined) {
  switch (sourceKind) {
    case 'local': return 'text-teal-400';
    case 'docker': return 'text-amber-400';
    case 'cloud': return 'text-violet-400';
    default: return 'text-slate-400';
  }
}

function TabItemRaw({ tab, active, onSelect, onClose }: TabItemProps) {
  const sourceKind = useConnectionStore(
    (state) => state.profiles.find((p) => p.id === tab.connectionId)?.sourceKind
  );
  const sourceColor = useMemo(() => getSourceColor(sourceKind), [sourceKind]);
  const iconColor = useMemo(() => getSourceIconColor(sourceKind), [sourceKind]);

  return (
    <div
      className={cn(
        'group relative flex min-w-0 max-w-[200px] shrink-0 cursor-pointer items-center gap-1.5 border-r border-border/10 px-3 py-2 text-xs transition-colors',
        active
          ? 'bg-muted/20 text-foreground'
          : 'bg-transparent text-muted-foreground hover:bg-muted/10 hover:text-foreground/80'
      )}
      onClick={() => onSelect(tab.id)}
    >
      {/* Color strip indicator */}
      {active && (
        <div className={cn('absolute bottom-0 left-0 right-0 h-[2px]', sourceColor)} />
      )}

      {/* Tab icon */}
      {tab.mode === 'table' ? (
        <Table2 className={cn('size-3 shrink-0', active ? iconColor : 'text-muted-foreground/50')} />
      ) : (
        <FileCode className={cn('size-3 shrink-0', active ? iconColor : 'text-muted-foreground/50')} />
      )}

      {/* Tab title */}
      <Tooltip>
        <TooltipTrigger render={<span className="min-w-0 flex-1 truncate font-medium" />}>{tab.title}</TooltipTrigger>
        <TooltipContent>{tab.mode === 'table' ? `${tab.schemaName}.${tab.tableName}` : tab.title}</TooltipContent>
      </Tooltip>

      {/* Close button - visible on hover or always for active */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground/50 transition-all hover:bg-muted hover:text-foreground',
                active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
              onClick={(event) => {
                event.stopPropagation();
                onClose(tab.id);
              }}
            />
          }
        >
          <X className="size-2.5" />
        </TooltipTrigger>
        <TooltipContent>Close tab</TooltipContent>
      </Tooltip>
    </div>
  );
}

export const TabItem = memo(TabItemRaw);
