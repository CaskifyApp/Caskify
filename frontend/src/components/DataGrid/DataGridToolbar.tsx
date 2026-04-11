import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DataGridToolbarProps {
  page: number;
  limit: number;
  totalRows: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onRefresh: () => void;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250];

export function DataGridToolbar({
  page,
  limit,
  totalRows,
  loading,
  onPageChange,
  onLimitChange,
  onRefresh,
}: DataGridToolbarProps) {
  const totalPages = Math.max(1, Math.ceil(totalRows / limit));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-4xl border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{totalRows} rows</span>
        <span className="text-border">•</span>
        <span>Page {page} of {totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <Select value={String(limit)} onValueChange={(value) => onLimitChange(Number(value))}>
          <SelectTrigger size="sm" className="w-28">
            <SelectValue placeholder="Rows" />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} rows
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={loading || page <= 1}>
          Prev
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={loading || page >= totalPages}>
          Next
        </Button>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw data-icon="inline-start" className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>
    </div>
  );
}
