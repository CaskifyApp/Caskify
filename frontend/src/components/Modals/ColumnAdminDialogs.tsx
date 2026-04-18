import { useEffect, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    <div className="grid gap-2">
      <Select value={selectValue} onValueChange={(nextValue) => {
        if (nextValue === CUSTOM_COLUMN_TYPE_VALUE) {
          if (usesPreset) {
            onChange('');
          }
          return;
        }
        onChange(nextValue ?? 'text');
      }}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose type" />
        </SelectTrigger>
        <SelectContent>
          {POSTGRES_COLUMN_TYPE_GROUPS.map((group, index) => (
            <SelectGroup key={group.label}>
              <SelectLabel>{group.label}</SelectLabel>
              {group.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
              {index < POSTGRES_COLUMN_TYPE_GROUPS.length - 1 ? <SelectSeparator /> : null}
            </SelectGroup>
          ))}
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Custom</SelectLabel>
            <SelectItem value={CUSTOM_COLUMN_TYPE_VALUE}>Custom...</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      {!usesPreset ? (
        <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="custom_type" />
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

  const handleSubmit = async () => {
    if (!columnName.trim() || !columnType.trim()) {
      setError('Column name and type are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await wails.AddColumn({
        profileId,
        database: databaseName,
        schema: schemaName,
        table: tableName,
        name: columnName.trim(),
        type: columnType.trim(),
        nullable,
        default: defaultValue.trim() || undefined,
      } as any);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Column</DialogTitle>
          <DialogDescription>Add a new column to {schemaName}.{tableName}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Input value={columnName} onChange={(event) => setColumnName(event.target.value)} placeholder="column_name" />
          <ColumnTypeField value={columnType} onChange={setColumnType} />
          <Input value={defaultValue} onChange={(event) => setDefaultValue(event.target.value)} placeholder="Default value (optional)" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={nullable} onChange={(event) => setNullable(event.target.checked)} /> Nullable</label>
        </div>
        {error ? <div className="text-sm text-destructive">{error}</div> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={() => void handleSubmit()} disabled={loading}>{loading ? 'Adding...' : 'Add Column'}</Button>
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
      await wails.RenameColumn({
        profileId,
        database: databaseName,
        schema: schemaName,
        table: tableName,
        oldName: columnName,
        newName: newName.trim(),
      } as any);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Column</DialogTitle>
          <DialogDescription>Rename column {columnName} in {schemaName}.{tableName}.</DialogDescription>
        </DialogHeader>
        <Input value={newName} onChange={(event) => setNewName(event.target.value)} />
        {error ? <div className="text-sm text-destructive">{error}</div> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={() => void handleSubmit()} disabled={loading}>{loading ? 'Renaming...' : 'Rename Column'}</Button>
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
      await wails.DropColumn({ profileId, database: databaseName, schema: schemaName, table: tableName, name: columnName } as any);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Drop Column</DialogTitle>
          <DialogDescription>This will permanently remove column "{columnName}" from {schemaName}.{tableName}. This action cannot be undone.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Type <span className="font-mono text-destructive">{columnName}</span> to confirm:</label>
          <Input
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
            placeholder={columnName}
            autoComplete="off"
          />
        </div>

        {error ? <div className="text-sm text-destructive">{error}</div> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={() => void handleSubmit()} disabled={loading || !isConfirmed}>{loading ? 'Dropping...' : 'Drop Column'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
