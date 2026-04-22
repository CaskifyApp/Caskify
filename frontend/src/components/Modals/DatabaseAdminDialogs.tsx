import { useEffect, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
      <DialogContent className="max-w-sm">
        <div className="h-1 w-full bg-teal-500" />
        <DialogHeader className="pb-2">
          <DialogTitle>Create Database</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-2 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Database Name</label>
            <Input 
              value={databaseName} 
              onChange={(event) => setDatabaseName(event.target.value)} 
              placeholder="my_database" 
              className="h-8 text-sm"
              autoFocus
            />
          </div>

          {error ? <div className="text-xs text-rose-400">{error}</div> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button size="sm" onClick={() => void handleCreate()} disabled={loading}>{loading ? 'Creating...' : 'Create Database'}</Button>
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
      <DialogContent className="max-w-sm">
        <div className="h-1 w-full bg-rose-500" />
        <DialogHeader className="pb-2">
          <DialogTitle className="text-rose-400">Drop Database</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-2 space-y-3">
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            This will permanently remove database <span className="font-mono text-foreground">{databaseName}</span> and all objects inside it. This action cannot be undone.
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Type <span className="font-mono text-rose-400">{databaseName}</span> to confirm
            </label>
            <Input
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              placeholder={databaseName}
              autoComplete="off"
              className="h-8 text-sm"
              autoFocus
            />
          </div>

          {error ? <div className="text-xs text-rose-400">{error}</div> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={() => void handleDrop()} disabled={loading || !isConfirmed}>{loading ? 'Dropping...' : 'Drop Database'}</Button>
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
      <DialogContent className="max-w-sm">
        <div className="h-1 w-full bg-teal-500" />
        <DialogHeader className="pb-2">
          <DialogTitle>Create Schema</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-2 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Schema Name</label>
            <Input 
              value={schemaName} 
              onChange={(event) => setSchemaName(event.target.value)} 
              placeholder="app_schema" 
              className="h-8 text-sm"
              autoFocus
            />
          </div>

          {error ? <div className="text-xs text-rose-400">{error}</div> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button size="sm" onClick={() => void handleCreate()} disabled={loading}>{loading ? 'Creating...' : 'Create Schema'}</Button>
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
      <DialogContent className="max-w-sm">
        <div className="h-1 w-full bg-rose-500" />
        <DialogHeader className="pb-2">
          <DialogTitle className="text-rose-400">Drop Schema</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-2 space-y-3">
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            This will permanently remove schema <span className="font-mono text-foreground">{schemaName}</span> from <span className="font-mono text-foreground">{databaseName}</span> and all objects inside it.
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Type <span className="font-mono text-rose-400">{schemaName}</span> to confirm
            </label>
            <Input
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              placeholder={schemaName}
              autoComplete="off"
              className="h-8 text-sm"
              autoFocus
            />
          </div>

          {error ? <div className="text-xs text-rose-400">{error}</div> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={() => void handleDrop()} disabled={loading || !isConfirmed}>{loading ? 'Dropping...' : 'Drop Schema'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}