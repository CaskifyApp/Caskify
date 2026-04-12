import { useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { CreateTableColumnInput } from '@/types';

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
  const [columns, setColumns] = useState<CreateTableColumnInput[]>([
    { name: 'id', type: 'uuid', nullable: false, defaultValue: undefined, isPrimaryKey: true },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateColumn = (index: number, patch: Partial<CreateTableColumnInput>) => {
    setColumns((current) => current.map((column, currentIndex) => (currentIndex === index ? { ...column, ...patch } : column)));
  };

  const addColumn = () => {
    setColumns((current) => [...current, { name: '', type: 'text', nullable: true, defaultValue: undefined, isPrimaryKey: false }]);
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
      setColumns([{ name: 'id', type: 'uuid', nullable: false, defaultValue: undefined, isPrimaryKey: true }]);
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
          <DialogDescription>Create a new table in schema "{schemaName}".</DialogDescription>
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
                  <Input value={column.type} onChange={(event) => updateColumn(index, { type: event.target.value })} placeholder="text" />
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = async () => {
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
          <DialogDescription>This will permanently remove table "{schemaName}.{tableName}".</DialogDescription>
        </DialogHeader>

        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={() => void handleDrop()} disabled={loading}>{loading ? 'Dropping...' : 'Drop Table'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
