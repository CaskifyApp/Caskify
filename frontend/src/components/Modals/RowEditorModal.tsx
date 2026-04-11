import { useEffect, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ColumnDef, InsertRowParams, UpdateRowParams } from '@/types';

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

    if (column.type === 'boolean') {
      return value === 'true';
    }

    if (column.type.includes('int') || column.type === 'numeric' || column.type === 'real' || column.type === 'double precision') {
      return Number(value);
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
      return column.isPrimaryKey || column.isIdentity || column.isGenerated || isTimestampAuditColumn(column);
    }

    return column.isGenerated || column.isPrimaryKey || column.isIdentity || isTimestampAuditColumn(column);
  };

  const visibleColumns = columns.filter((column) => !shouldHideColumn(column));
  const editableColumns = visibleColumns.filter((column) => !isReadonlyColumn(column));

  const isReadonlyColumn = (column: ColumnDef) => column.isIdentity || column.isGenerated || column.isPrimaryKey || !column.isUpdatable;

  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);

    const nextDraft: Record<string, string> = {};
    for (const column of columns) {
      const value = row?.[column.name];
      nextDraft[column.name] = value === null || value === undefined ? '' : String(value);
    }
    setDraft(nextDraft);
  }, [columns, open, row]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      if (mode === 'insert') {
        const payload: InsertRowParams = {
          profileId,
          database,
          schema,
          table,
          values: Object.fromEntries(visibleColumns.map((column) => [column.name, normalizeValue(column, draft[column.name] ?? '')])),
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
              ) : (
                <Input
                  type={column.type.includes('int') || column.type === 'numeric' || column.type === 'real' || column.type === 'double precision' ? 'number' : 'text'}
                  value={draft[column.name] ?? ''}
                  onChange={(event) => setDraftValue(column.name, event.target.value)}
                  disabled={isReadonlyColumn(column)}
                />
              )}
              <div className="text-xs text-muted-foreground">
                {column.type}
                {column.isNullable ? ' • nullable' : ' • required'}
                {column.hasDefault ? ' • defaulted' : ''}
                {column.isIdentity ? ' • identity' : ''}
                {column.isGenerated ? ' • generated' : ''}
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
