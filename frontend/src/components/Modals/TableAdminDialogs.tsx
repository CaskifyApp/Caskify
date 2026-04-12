import { useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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
  const [columnName, setColumnName] = useState('id');
  const [columnType, setColumnType] = useState('uuid');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!tableName.trim() || !columnName.trim() || !columnType.trim()) {
      setError('Table name and first column definition are required.');
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
        columns: [{ name: columnName.trim(), type: columnType.trim(), nullable: false }],
      } as any);
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
          <div className="grid gap-2">
            <label className="text-sm font-medium">First Column Name</label>
            <Input value={columnName} onChange={(event) => setColumnName(event.target.value)} placeholder="id" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">First Column Type</label>
            <Input value={columnType} onChange={(event) => setColumnType(event.target.value)} placeholder="uuid" />
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
