import { RefreshCw, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DataGridToolbarProps {
  page: number;
  limit: number;
  totalRows: number;
  estimated?: boolean;
  columns: string[];
  filterColumn?: string;
  filterValue?: string;
  loading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onFilterColumnChange: (column: string) => void;
  onFilterValueChange: (value: string) => void;
  onRefresh: () => void;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250];

export function DataGridToolbar({
  page,
  limit,
  totalRows,
  estimated = false,
  columns,
  filterColumn,
  filterValue,
  loading,
  onPageChange,
  onLimitChange,
  onFilterColumnChange,
  onFilterValueChange,
  onRefresh,
}: DataGridToolbarProps) {
  const totalPages = Math.max(1, Math.ceil(totalRows / limit));

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/10 bg-muted/10 px-3 py-1.5">
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-muted-foreground">
          {estimated ? `~${totalRows.toLocaleString()} rows` : `${totalRows.toLocaleString()} rows`}
        </span>
        <span className="text-[11px] text-muted-foreground/50">
          Page {page} of {totalPages}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1.5 rounded-md border border-border/10 bg-background px-2 py-0.5">
          <Search className="size-3 text-muted-foreground/50" />
          <Select value={filterColumn || undefined} onValueChange={(value) => onFilterColumnChange(value ?? '')}>
            <SelectTrigger className="h-6 w-28 border-0 bg-transparent p-0 text-[11px] shadow-none focus:ring-0">
              <SelectValue placeholder="Column" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((column) => (
                <SelectItem key={column} value={column} className="text-xs">{column}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Input
          value={filterValue ?? ''}
          onChange={(event) => onFilterValueChange(event.target.value)}
          placeholder={filterColumn ? 'Search...' : 'Select column'}
          className="h-6 w-40 border-border/10 bg-background px-2 text-[11px] shadow-none focus-visible:ring-1"
          disabled={!filterColumn}
        />

        <Select value={String(limit)} onValueChange={(value) => onLimitChange(Number(value))}>
          <SelectTrigger className="h-6 w-16 border-border/10 bg-background text-[11px] shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)} className="text-xs">{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={loading || page <= 1}
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onPageChange(page + 1)}
            disabled={loading || page >= totalPages}
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
        </Button>
      </div>
    </div>
  );
}
