import { useEffect, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { db } from '../../../wailsjs/go/models';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CUSTOM_COLUMN_TYPE_VALUE, isPresetPostgresColumnType, normalizePostgresColumnType, POSTGRES_COLUMN_TYPE_GROUPS } from '@/lib/postgres-column-types';

function ColumnTypeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const normalizedValue = normalizePostgresColumnType(value);
  const usesPreset = isPresetPostgresColumnType(normalizedValue);
  const selectValue = usesPreset ? normalizedValue : CUSTOM_COLUMN_TYPE_VALUE;

  return (
    <div className="space-y-1">
      <Select value={selectValue} onValueChange={(nextValue) => {
        if (nextValue === CUSTOM_COLUMN_TYPE_VALUE) {
          if (usesPreset) {
            onChange('');
          }
          return;
        }
        onChange(nextValue ?? 'text');
      }}>
        <SelectTrigger className="h-8 w-full text-sm">
          <SelectValue placeholder="Choose type" />
        </SelectTrigger>
        <SelectContent>
          {POSTGRES_COLUMN_TYPE_GROUPS.map((group, index) => (
            <SelectGroup key={group.label}>
              <SelectLabel className="text-[10px] uppercase tracking-wider">{group.label}</SelectLabel>
              {group.options.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
              {index < POSTGRES_COLUMN_TYPE_GROUPS.length - 1 ? <SelectSeparator /> : null}
            </SelectGroup>
          ))}
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel className="text-[10px] uppercase tracking-wider">Custom</SelectLabel>
            <SelectItem value={CUSTOM_COLUMN_TYPE_VALUE} className="text-xs">Custom...</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      {!usesPreset ? (
        <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="custom_type" className="h-8 text-sm" />
      ) : null}
    </div>
  );
}

interface BaseColumnDialogProps {
  profileId: string;
  databaseName: string;
  schemaName: string;
  tableName: string;
  onSuccess: () => void;
}

interface AddColumnDialogProps extends BaseColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddColumnDialog({ open, onOpenChange, profileId, databaseName, schemaName, tableName, onSuccess }: AddColumnDialogProps) {
  const [columnName, setColumnName] = useState('');
  const [columnType, setColumnType] = useState('text');
  const [defaultValue, setDefaultValue] = useState('');
  const [nullable, setNullable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setColumnName('');
    setColumnType('text');
    setDefaultValue('');
    setNullable(true);
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    if (!columnName.trim() || !columnType.trim()) {
      setError('Column name and type are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await wails.AddColumn(db.AddColumnParams.createFrom({
        profileId,
        database: databaseName,
        schema: schemaName,
        table: tableName,
        name: columnName.trim(),
        type: columnType.trim(),
        nullable,
        default: defaultValue.trim() || undefined,
      }));
      onOpenChange(false);
      onSuccess();
    } catch (nextError) {
      setError(String(nextError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <div className="h-1 w-full bg-teal-500" />
        <DialogHeader className="pb-2">
          <DialogTitle>Add Column</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-2 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Column Name</label>
            <Input value={columnName} onChange={(event) => setColumnName(event.target.value)} placeholder="column_name" className="h-8 text-sm" autoFocus />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Data Type</label>
            <ColumnTypeField value={columnType} onChange={setColumnType} />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Default Value</label>
            <Input value={defaultValue} onChange={(event) => setDefaultValue(event.target.value)} placeholder="Optional" className="h-8 text-sm" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={nullable} onChange={(event) => setNullable(event.target.checked)} className="size-4 rounded border-border" />
            <span className="text-muted-foreground/70">Nullable</span>
          </label>

          {error ? <div className="text-xs text-rose-400">{error}</div> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button size="sm" onClick={() => void handleSubmit()} disabled={loading}>{loading ? 'Adding...' : 'Add Column'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RenameColumnDialogProps extends BaseColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnName: string;
}

export function RenameColumnDialog({ open, onOpenChange, profileId, databaseName, schemaName, tableName, columnName, onSuccess }: RenameColumnDialogProps) {
  const [newName, setNewName] = useState(columnName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!newName.trim()) {
      setError('New column name is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await wails.RenameColumn(db.RenameColumnParams.createFrom({
        profileId,
        database: databaseName,
        schema: schemaName,
        table: tableName,
        oldName: columnName,
        newName: newName.trim(),
      }));
      onOpenChange(false);
      onSuccess();
    } catch (nextError) {
      setError(String(nextError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <div className="h-1 w-full bg-amber-500" />
        <DialogHeader className="pb-2">
          <DialogTitle>Rename Column</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-2 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">New Name</label>
            <Input value={newName} onChange={(event) => setNewName(event.target.value)} className="h-8 text-sm" autoFocus />
          </div>

          {error ? <div className="text-xs text-rose-400">{error}</div> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button size="sm" onClick={() => void handleSubmit()} disabled={loading}>{loading ? 'Renaming...' : 'Rename Column'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DropColumnDialogProps extends BaseColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnName: string;
}

export function DropColumnDialog({ open, onOpenChange, profileId, databaseName, schemaName, tableName, columnName, onSuccess }: DropColumnDialogProps) {
  const [confirmName, setConfirmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setConfirmName('');
      setError(null);
    }
  }, [open]);

  const isConfirmed = confirmName === columnName;

  const handleSubmit = async () => {
    if (!isConfirmed) {
      setError('You must type the column name to confirm.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await wails.DropColumn(db.DropColumnParams.createFrom({ profileId, database: databaseName, schema: schemaName, table: tableName, name: columnName }));
      onOpenChange(false);
      onSuccess();
    } catch (nextError) {
      setError(String(nextError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <div className="h-1 w-full bg-rose-500" />
        <DialogHeader className="pb-2">
          <DialogTitle className="text-rose-400">Drop Column</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-2 space-y-3">
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            This will permanently remove column <span className="font-mono text-foreground">{columnName}</span> from <span className="font-mono text-foreground">{schemaName}.{tableName}</span>.
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Type <span className="font-mono text-rose-400">{columnName}</span> to confirm
            </label>
            <Input
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              placeholder={columnName}
              autoComplete="off"
              className="h-8 text-sm"
              autoFocus
            />
          </div>

          {error ? <div className="text-xs text-rose-400">{error}</div> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={() => void handleSubmit()} disabled={loading || !isConfirmed}>{loading ? 'Dropping...' : 'Drop Column'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}