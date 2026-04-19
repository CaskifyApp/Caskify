import { useEffect, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
        <DialogHeader>
          <DialogTitle>{mode === 'insert' ? 'Insert Row' : 'Edit Row'}</DialogTitle>
          <DialogDescription>
            Review editable fields and save your changes. Generated and read-only columns are hidden automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[60vh] gap-4 overflow-auto pr-1">
          {visibleColumns.map((column) => (
            <div key={column.name} className="grid gap-2">
              <label className="text-sm font-medium text-foreground">{column.name}</label>
              {column.type === 'boolean' ? (
                <Select value={draft[column.name] ?? ''} onValueChange={(value) => setDraftValue(column.name, value ?? '')} disabled={isReadonlyColumn(column)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select boolean value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">NULL</SelectItem>
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                  </SelectContent>
                </Select>
              ) : isJsonColumn(column) || isLongTextColumn(column) ? (
                <textarea
                  value={draft[column.name] ?? ''}
                  onChange={(event) => setDraftValue(column.name, event.target.value)}
                  disabled={isReadonlyColumn(column)}
                  rows={isJsonColumn(column) ? 8 : 4}
                  className="min-h-24 rounded-3xl border border-input bg-background px-3 py-2 text-sm"
                />
              ) : isTimestampColumn(column) ? (
                <Input
                  type="datetime-local"
                  value={draft[column.name] ?? ''}
                  onChange={(event) => setDraftValue(column.name, event.target.value)}
                  disabled={isReadonlyColumn(column)}
                />
              ) : (
                <Input
                  type={isNumericColumn(column) ? 'number' : 'text'}
                  value={draft[column.name] ?? ''}
                  onChange={(event) => setDraftValue(column.name, event.target.value)}
                  disabled={isReadonlyColumn(column)}
                  placeholder={isUuidColumn(column) ? '550e8400-e29b-41d4-a716-446655440000' : undefined}
                />
              )}
              {isUuidColumn(column) && !isReadonlyColumn(column) ? (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDraftValue(column.name, crypto.randomUUID())}
                    type="button"
                  >
                    Generate UUID
                  </Button>
                </div>
              ) : null}
              <div className="text-xs text-muted-foreground">
                {column.type}
                {column.isNullable ? ' • nullable' : ' • required'}
                {column.hasDefault ? ' • defaulted' : ''}
                {column.isIdentity ? ' • identity' : ''}
                {column.isGenerated ? ' • generated' : ''}
                {requiresManualValue(column) ? ' • manual value required' : ''}
                {isReadonlyColumn(column) ? ' • read-only' : ''}
              </div>
            </div>
          ))}
        </div>

        {editableColumns.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No editable columns are available for this action.
          </div>
        ) : null}

        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <DialogFooter className="sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Close
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || editableColumns.length === 0}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
