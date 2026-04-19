import { useEffect, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CUSTOM_COLUMN_TYPE_VALUE, isPresetPostgresColumnType, normalizePostgresColumnType, POSTGRES_COLUMN_TYPE_GROUPS } from '@/lib/postgres-column-types';
import type { CreateTableColumnInput } from '@/types';

const DEFAULT_PRIMARY_KEY_COLUMN: CreateTableColumnInput = {
  name: 'id',
  type: 'serial',
  nullable: false,
  defaultValue: undefined,
  isPrimaryKey: true,
};

const DEFAULT_TEXT_COLUMN: CreateTableColumnInput = {
  name: '',
  type: 'text',
  nullable: true,
  defaultValue: undefined,
  isPrimaryKey: false,
};

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

interface CreateTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  databaseName: string;
  schemaName: string;
  onSuccess: () => void;
}

export function CreateTableDialog({ open, onOpenChange, profileId, databaseName, schemaName, onSuccess }: CreateTableDialogProps) {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<CreateTableColumnInput[]>([{ ...DEFAULT_PRIMARY_KEY_COLUMN }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTableName('');
    setColumns([{ ...DEFAULT_PRIMARY_KEY_COLUMN }]);
    setError(null);
  }, [open]);

  const updateColumn = (index: number, patch: Partial<CreateTableColumnInput>) => {
    setColumns((current) => current.map((column, currentIndex) => (currentIndex === index ? { ...column, ...patch } : column)));
  };

  const addColumn = () => {
    setColumns((current) => [...current, { ...DEFAULT_TEXT_COLUMN }]);
  };

  const removeColumn = (index: number) => {
    setColumns((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleCreate = async () => {
    if (!tableName.trim()) {
      setError('Table name is required.');
      return;
    }

    if (columns.length === 0 || columns.some((column) => !column.name.trim() || !column.type.trim())) {
      setError('Every column needs a name and type.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await wails.CreateTable({
        profileId,
        database: databaseName,
        schema: schemaName,
        name: tableName.trim(),
        columns,
      } as any);
      setColumns([{ ...DEFAULT_PRIMARY_KEY_COLUMN }]);
      setTableName('');
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Table</DialogTitle>
          <DialogDescription>Create a new table in schema "{schemaName}". The first column defaults to a testing-friendly serial primary key.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Table Name</label>
            <Input value={tableName} onChange={(event) => setTableName(event.target.value)} placeholder="new_table" />
          </div>
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Columns</label>
              <Button variant="outline" size="sm" onClick={addColumn}>Add Column</Button>
            </div>

            {columns.map((column, index) => (
              <div key={index} className="grid gap-2 rounded-3xl border p-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={column.name} onChange={(event) => updateColumn(index, { name: event.target.value })} placeholder="column_name" />
                  <ColumnTypeField value={column.type} onChange={(value) => updateColumn(index, { type: value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={column.defaultValue ?? ''} onChange={(event) => updateColumn(index, { defaultValue: event.target.value || undefined })} placeholder="Default value (optional)" />
                  <div className="flex items-center justify-between rounded-2xl border px-3 py-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={!column.nullable} onChange={(event) => updateColumn(index, { nullable: !event.target.checked })} />
                      <span>Not null</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={column.isPrimaryKey} onChange={(event) => updateColumn(index, { isPrimaryKey: event.target.checked, nullable: event.target.checked ? false : column.nullable })} />
                      <span>Primary key</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => removeColumn(index)} disabled={columns.length === 1}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={() => void handleCreate()} disabled={loading}>{loading ? 'Creating...' : 'Create Table'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RenameTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  databaseName: string;
  schemaName: string;
  tableName: string;
  onSuccess: () => void;
}

export function RenameTableDialog({ open, onOpenChange, profileId, databaseName, schemaName, tableName, onSuccess }: RenameTableDialogProps) {
  const [newName, setNewName] = useState(tableName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRename = async () => {
    if (!newName.trim()) {
      setError('New table name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await wails.RenameTable({
        profileId,
        database: databaseName,
        schema: schemaName,
        oldName: tableName,
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
          <DialogTitle>Rename Table</DialogTitle>
          <DialogDescription>Rename table "{schemaName}.{tableName}".</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <label className="text-sm font-medium">New Name</label>
          <Input value={newName} onChange={(event) => setNewName(event.target.value)} />
        </div>

        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={() => void handleRename()} disabled={loading}>{loading ? 'Renaming...' : 'Rename Table'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DropTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  databaseName: string;
  schemaName: string;
  tableName: string;
  onSuccess: () => void;
}

export function DropTableDialog({ open, onOpenChange, profileId, databaseName, schemaName, tableName, onSuccess }: DropTableDialogProps) {
  const [confirmName, setConfirmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setConfirmName('');
      setError(null);
    }
  }, [open]);

  const isConfirmed = confirmName === tableName;

  const handleDrop = async () => {
    if (!isConfirmed) {
      setError('You must type the table name to confirm.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await wails.DropTable({ profileId, database: databaseName, schema: schemaName, name: tableName } as any);
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
          <DialogTitle>Drop Table</DialogTitle>
          <DialogDescription>This will permanently remove table "{schemaName}.{tableName}" and all data inside it. This action cannot be undone.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Type <span className="font-mono text-destructive">{tableName}</span> to confirm:</label>
          <Input
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
            placeholder={tableName}
            autoComplete="off"
          />
        </div>

        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={() => void handleDrop()} disabled={loading || !isConfirmed}>{loading ? 'Dropping...' : 'Drop Table'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
