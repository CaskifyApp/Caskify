import { useEffect, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface CreateDatabaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  onSuccess: () => void;
}

export function CreateDatabaseDialog({ open, onOpenChange, profileId, onSuccess }: CreateDatabaseDialogProps) {
  const [databaseName, setDatabaseName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDatabaseName('');
      setError(null);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!databaseName.trim()) {
      setError('Database name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await wails.CreateEmptyDatabase({ profileId, name: databaseName.trim() });
      setDatabaseName('');
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
          <DialogTitle>Create Database</DialogTitle>
          <DialogDescription>Create a new empty PostgreSQL database on the selected server.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Database Name</label>
          <Input value={databaseName} onChange={(event) => setDatabaseName(event.target.value)} placeholder="my_database" />
        </div>

        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={() => void handleCreate()} disabled={loading}>{loading ? 'Creating...' : 'Create Database'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DropDatabaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  databaseName: string;
  onSuccess: () => void;
}

export function DropDatabaseDialog({ open, onOpenChange, profileId, databaseName, onSuccess }: DropDatabaseDialogProps) {
  const [confirmName, setConfirmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setConfirmName('');
      setError(null);
    }
  }, [open]);

  const isConfirmed = confirmName === databaseName;

  const handleDrop = async () => {
    if (!isConfirmed) {
      setError('You must type the database name to confirm.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await wails.DropDatabase({ profileId, name: databaseName });
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
          <DialogTitle>Drop Database</DialogTitle>
          <DialogDescription>This will permanently remove database "{databaseName}" and all objects inside it. This action cannot be undone.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Type <span className="font-mono text-destructive">{databaseName}</span> to confirm:</label>
          <Input
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
            placeholder={databaseName}
            autoComplete="off"
          />
        </div>

        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={() => void handleDrop()} disabled={loading || !isConfirmed}>{loading ? 'Dropping...' : 'Drop Database'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CreateSchemaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  databaseName: string;
  onSuccess: () => void;
}

export function CreateSchemaDialog({ open, onOpenChange, profileId, databaseName, onSuccess }: CreateSchemaDialogProps) {
  const [schemaName, setSchemaName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSchemaName('');
      setError(null);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!schemaName.trim()) {
      setError('Schema name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await wails.CreateSchema({ profileId, database: databaseName, name: schemaName.trim() });
      setSchemaName('');
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
          <DialogTitle>Create Schema</DialogTitle>
          <DialogDescription>Create a new schema in database "{databaseName}".</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Schema Name</label>
          <Input value={schemaName} onChange={(event) => setSchemaName(event.target.value)} placeholder="app_schema" />
        </div>

        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={() => void handleCreate()} disabled={loading}>{loading ? 'Creating...' : 'Create Schema'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DropSchemaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  databaseName: string;
  schemaName: string;
  onSuccess: () => void;
}

export function DropSchemaDialog({ open, onOpenChange, profileId, databaseName, schemaName, onSuccess }: DropSchemaDialogProps) {
  const [confirmName, setConfirmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setConfirmName('');
      setError(null);
    }
  }, [open]);

  const isConfirmed = confirmName === schemaName;

  const handleDrop = async () => {
    if (!isConfirmed) {
      setError('You must type the schema name to confirm.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await wails.DropSchema({ profileId, database: databaseName, name: schemaName });
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
          <DialogTitle>Drop Schema</DialogTitle>
          <DialogDescription>This will permanently remove schema "{schemaName}" from "{databaseName}" and all objects inside it. This action cannot be undone.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Type <span className="font-mono text-destructive">{schemaName}</span> to confirm:</label>
          <Input
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
            placeholder={schemaName}
            autoComplete="off"
          />
        </div>

        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={() => void handleDrop()} disabled={loading || !isConfirmed}>{loading ? 'Dropping...' : 'Drop Schema'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
