import { useEffect, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyRound, Sparkles } from 'lucide-react';
import type { ColumnDef, InsertRowParams, UpdateRowParams } from '@/types';

function isNumericColumn(column: ColumnDef) {
  return column.type.includes('int') || column.type === 'numeric' || column.type === 'real' || column.type === 'double precision';
}

function isJsonColumn(column: ColumnDef) {
  return column.type === 'json' || column.type === 'jsonb';
}

function isTimestampColumn(column: ColumnDef) {
  return column.type.includes('timestamp') || column.type.includes('date');
}

function isLongTextColumn(column: ColumnDef) {
  return column.type === 'text';
}

function isUuidColumn(column: ColumnDef) {
  return column.type === 'uuid';
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function requiresManualValue(column: ColumnDef) {
  return !column.isNullable && !column.hasDefault && !column.isIdentity && !column.isGenerated;
}

function formatDraftValue(column: ColumnDef, value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  if (isJsonColumn(column) && typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  if (isTimestampColumn(column)) {
    const parsed = new Date(String(value));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 16);
    }
  }

  return String(value);
}

interface RowEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnDef[];
  row: Record<string, unknown> | null;
  mode: 'insert' | 'edit';
  profileId: string;
  database: string;
  schema: string;
  table: string;
  onSaved: () => void;
}

export function RowEditorModal({ open, onOpenChange, columns, row, mode, profileId, database, schema, table, onSaved }: RowEditorModalProps) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDraftValue = (columnName: string, value: string) => {
    setDraft((current) => ({
      ...current,
      [columnName]: value,
    }));
  };

  const normalizeValue = (column: ColumnDef, value: string): unknown => {
    if (value === '') {
      return null;
    }

    if (isUuidColumn(column)) {
      if (!isValidUuid(value)) {
        throw new Error(`Invalid UUID value for ${column.name}`);
      }
      return value;
    }

    if (column.type === 'boolean') {
      return value === 'true';
    }

    if (isNumericColumn(column)) {
      return Number(value);
    }

    if (isJsonColumn(column)) {
      try {
        return JSON.parse(value);
      } catch {
        throw new Error(`Invalid JSON value for ${column.name}`);
      }
    }

    return value;
  };

  const isTimestampAuditColumn = (column: ColumnDef) => {
    const normalizedName = column.name.toLowerCase();
    const isAuditName = normalizedName === 'created_at' || normalizedName === 'updated_at' || normalizedName === 'deleted_at';
    return isAuditName && column.hasDefault;
  };

  const shouldHideColumn = (column: ColumnDef) => {
    if (mode === 'insert') {
      return column.isIdentity || column.isGenerated || isTimestampAuditColumn(column) || (column.isPrimaryKey && column.hasDefault);
    }

    return column.isGenerated || column.isPrimaryKey || column.isIdentity || isTimestampAuditColumn(column);
  };

  const isReadonlyColumn = (column: ColumnDef) => {
    if (mode === 'insert') {
      return column.isIdentity || column.isGenerated || (!column.isUpdatable && !requiresManualValue(column));
    }

    return column.isIdentity || column.isGenerated || column.isPrimaryKey || !column.isUpdatable;
  };

  const visibleColumns = columns.filter((column) => !shouldHideColumn(column));
  const editableColumns = visibleColumns.filter((column) => !isReadonlyColumn(column));

  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);

    const nextDraft: Record<string, string> = {};
    for (const column of columns) {
      const value = row?.[column.name];
      nextDraft[column.name] = formatDraftValue(column, value);
    }
    setDraft(nextDraft);
  }, [columns, open, row]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      if (mode === 'insert') {
        const missingRequiredColumn = editableColumns.find((column) => requiresManualValue(column) && normalizeValue(column, draft[column.name] ?? '') === null);
        if (missingRequiredColumn) {
          throw new Error(`${missingRequiredColumn.name} is required.`);
        }

        const payload: InsertRowParams = {
          profileId,
          database,
          schema,
          table,
          values: Object.fromEntries(editableColumns.map((column) => [column.name, normalizeValue(column, draft[column.name] ?? '')])),
        };
        await wails.InsertTableRow(payload);
      } else {
        const payload: UpdateRowParams = {
          profileId,
          database,
          schema,
          table,
          values: Object.fromEntries(visibleColumns.filter((column) => !isReadonlyColumn(column)).map((column) => [column.name, normalizeValue(column, draft[column.name] ?? '')])),
          originalValues: row ?? {},
        };
        await wails.UpdateTableRow(payload);
      }

      onSaved();
      onOpenChange(false);
    } catch (nextError) {
      setError(String(nextError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <div className="h-1 w-full bg-slate-500" />
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-slate-400" />
            <DialogTitle>{mode === 'insert' ? 'Insert Row' : 'Edit Row'}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-5 py-2 space-y-0 max-h-[60vh] overflow-auto">
          {visibleColumns.map((column) => (
            <div key={column.name} className="flex items-start gap-3 py-2 border-b border-border/10 last:border-0">
              {/* Label column */}
              <div className="w-32 shrink-0 pt-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-medium text-foreground">{column.name}</span>
                  {column.isPrimaryKey && <KeyRound className="size-3 text-amber-400/70" />}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-[10px] px-1 py-0.5 rounded bg-muted/50 text-muted-foreground/60 font-mono">{column.type}</span>
                  {column.isNullable && <span className="text-[10px] px-1 py-0.5 rounded bg-muted/50 text-muted-foreground/40">null</span>}
                  {requiresManualValue(column) && <span className="text-[10px] px-1 py-0.5 rounded bg-rose-500/10 text-rose-400/70">required</span>}
                  {isReadonlyColumn(column) && <span className="text-[10px] px-1 py-0.5 rounded bg-muted/50 text-muted-foreground/40">ro</span>}
                </div>
              </div>

              {/* Input column */}
              <div className="flex-1 min-w-0">
                {column.type === 'boolean' ? (
                  <Select value={draft[column.name] ?? ''} onValueChange={(value) => setDraftValue(column.name, value ?? '')} disabled={isReadonlyColumn(column)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="NULL" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">NULL</SelectItem>
                      <SelectItem value="true">true</SelectItem>
                      <SelectItem value="false">false</SelectItem>
                    </SelectContent>
                  </Select>
                ) : isJsonColumn(column) || isLongTextColumn(column) ? (
                  <Textarea
                    value={draft[column.name] ?? ''}
                    onChange={(event) => setDraftValue(column.name, event.target.value)}
                    disabled={isReadonlyColumn(column)}
                    rows={isJsonColumn(column) ? 6 : 3}
                    className="w-full min-h-[60px] resize-y px-3 py-2 text-xs font-mono"
                  />
                ) : isTimestampColumn(column) ? (
                  <Input
                    type="datetime-local"
                    value={draft[column.name] ?? ''}
                    onChange={(event) => setDraftValue(column.name, event.target.value)}
                    disabled={isReadonlyColumn(column)}
                    className="h-8 text-xs"
                  />
                ) : (
                  <div className="relative">
                    <Input
                      type={isNumericColumn(column) ? 'number' : 'text'}
                      value={draft[column.name] ?? ''}
                      onChange={(event) => setDraftValue(column.name, event.target.value)}
                      disabled={isReadonlyColumn(column)}
                      placeholder={isUuidColumn(column) ? '550e8400-e29b-41d4-a716-446655440000' : undefined}
                      className="h-8 text-xs"
                    />
                    {isUuidColumn(column) && !isReadonlyColumn(column) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5"
                        onClick={() => setDraftValue(column.name, crypto.randomUUID())}
                        type="button"
                        title="Generate UUID"
                      >
                        <Sparkles className="size-3 text-muted-foreground/50" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {editableColumns.length === 0 ? (
          <div className="px-5 text-sm text-muted-foreground/50">
            No editable columns are available for this action.
          </div>
        ) : null}

        {error ? <div className="px-5 text-xs text-rose-400">{error}</div> : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
            Close
          </Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={saving || editableColumns.length === 0}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
