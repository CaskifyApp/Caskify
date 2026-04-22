import { Braces, Check, X, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CellRendererProps {
  value: unknown;
  columnType?: string;
  onOpenJson: (value: unknown) => void;
}

function isJsonLike(value: unknown) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isArrayLike(value: unknown) {
  return Array.isArray(value);
}

function formatTimestamp(value: string) {
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) + ' ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return value;
  }
}

function truncateText(value: string, maxLength = 60) {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength) + '\u2026';
}

function isTimestampType(type?: string) {
  if (!type) return false;
  const lower = type.toLowerCase();
  return lower.includes('timestamp') || lower.includes('date') || lower.includes('time');
}

function isNumericType(type?: string) {
  if (!type) return false;
  const lower = type.toLowerCase();
  return lower.includes('int') || lower.includes('float') || lower.includes('double') || lower.includes('numeric') || lower.includes('decimal') || lower.includes('serial');
}

export function CellRenderer({ value, columnType, onOpenJson }: CellRendererProps) {
  if (value === null || value === undefined) {
    return (
      <span className="font-mono text-[11px] italic text-muted-foreground/40">null</span>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold',
        value ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
      )}>
        {value ? <Check className="size-2.5" /> : <X className="size-2.5" />}
        {value ? 'true' : 'false'}
      </span>
    );
  }

  if (typeof value === 'number' && isNumericType(columnType)) {
    return (
      <span className="font-mono text-[12px] text-amber-300/80">
        {Number.isInteger(value) ? value.toLocaleString() : value.toFixed(4)}
      </span>
    );
  }

  if (typeof value === 'string' && isTimestampType(columnType)) {
    return (
      <span className="font-mono text-[11px] text-purple-300/70 whitespace-nowrap">
        {formatTimestamp(value)}
      </span>
    );
  }

  if (isJsonLike(value)) {
    const preview = JSON.stringify(value).slice(0, 40);
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400 transition-colors hover:bg-violet-500/20"
        onClick={() => onOpenJson(value)}
      >
        <Braces className="size-3" />
        {truncateText(preview, 30)}
      </button>
    );
  }

  if (isArrayLike(value)) {
    const preview = JSON.stringify(value).slice(0, 40);
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20"
        onClick={() => onOpenJson(value)}
      >
        <Database className="size-3" />
        {truncateText(preview, 30)}
      </button>
    );
  }

  if (typeof value === 'string') {
    const display = truncateText(value, 80);
    return (
      <span className="font-mono text-[12px] text-foreground/80 whitespace-pre-wrap break-all">
        {display}
      </span>
    );
  }

  return <span className="font-mono text-[12px] text-foreground/80">{String(value)}</span>;
}
