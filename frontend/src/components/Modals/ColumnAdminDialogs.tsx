import { useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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
          <Input value={columnType} onChange={(event) => setColumnType(event.target.value)} placeholder="text" />
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
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
          <DialogDescription>This will permanently remove column {columnName} from {schemaName}.{tableName}.</DialogDescription>
        </DialogHeader>
        {error ? <div className="text-sm text-destructive">{error}</div> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={() => void handleSubmit()} disabled={loading}>{loading ? 'Dropping...' : 'Drop Column'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
