import { useEffect, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { db } from '../../../wailsjs/go/models';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, KeyRound, Ban } from 'lucide-react';
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
        <SelectTrigger className="h-7 w-full text-xs">
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
        <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="custom_type" className="h-7 text-xs" />
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
      await wails.CreateTable(db.CreateTableParams.createFrom({
        profileId,
        database: databaseName,
        schema: schemaName,
        name: tableName.trim(),
        columns,
      }));
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
      <DialogContent className="max-w-xl">
        <div className="h-1 w-full bg-teal-500" />
        <DialogHeader className="pb-2">
          <DialogTitle>Create Table</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-2 space-y-4 max-h-[60vh] overflow-auto">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Table Name</label>
            <Input value={tableName} onChange={(event) => setTableName(event.target.value)} placeholder="new_table" className="h-8 text-sm" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Columns</span>
              <Button variant="outline" size="sm" className="h-6 gap-1 text-xs" onClick={addColumn}>
                <Plus className="size-3" /> Add
              </Button>
            </div>

            <div className="space-y-2">
              {columns.map((column, index) => (
                <div key={index} className="rounded-md border border-border/20 bg-muted/10 p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground/50">Name</label>
                      <Input 
                        value={column.name} 
                        onChange={(event) => updateColumn(index, { name: event.target.value })} 
                        placeholder="column_name" 
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground/50">Type</label>
                      <ColumnTypeField value={column.type} onChange={(value) => updateColumn(index, { type: value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground/50">Default</label>
                      <Input 
                        value={column.defaultValue ?? ''} 
                        onChange={(event) => updateColumn(index, { defaultValue: event.target.value || undefined })} 
                        placeholder="Optional" 
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-4">
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <Switch
                          checked={!column.nullable}
                          onCheckedChange={(checked) => updateColumn(index, { nullable: !checked })}
                          className="scale-75"
                        />
                        <Ban className="size-3 text-muted-foreground/50" />
                        <span className="text-muted-foreground/70">Not null</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <Switch
                          checked={column.isPrimaryKey}
                          onCheckedChange={(checked) =>
                            updateColumn(index, {
                              isPrimaryKey: checked,
                              nullable: checked ? false : column.nullable,
                            })
                          }
                          className="scale-75"
                        />
                        <KeyRound className="size-3 text-amber-400/70" />
                        <span className="text-muted-foreground/70">PK</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs text-rose-400 hover:text-rose-300" onClick={() => removeColumn(index)} disabled={columns.length === 1}>
                      <Trash2 className="size-3" /> Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error ? <div className="text-xs text-rose-400">{error}</div> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button size="sm" onClick={() => void handleCreate()} disabled={loading}>{loading ? 'Creating...' : 'Create Table'}</Button>
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
      await wails.RenameTable(db.RenameTableParams.createFrom({
        profileId,
        database: databaseName,
        schema: schemaName,
        oldName: tableName,
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
          <DialogTitle>Rename Table</DialogTitle>
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
          <Button size="sm" onClick={() => void handleRename()} disabled={loading}>{loading ? 'Renaming...' : 'Rename Table'}</Button>
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
      await wails.DropTable(db.DropTableParams.createFrom({ profileId, database: databaseName, schema: schemaName, name: tableName }));
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
          <DialogTitle className="text-rose-400">Drop Table</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-2 space-y-3">
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            This will permanently remove table <span className="font-mono text-foreground">{schemaName}.{tableName}</span> and all data inside it.
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Type <span className="font-mono text-rose-400">{tableName}</span> to confirm
            </label>
            <Input
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              placeholder={tableName}
              autoComplete="off"
              className="h-8 text-sm"
              autoFocus
            />
          </div>

          {error ? <div className="text-xs text-rose-400">{error}</div> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={() => void handleDrop()} disabled={loading || !isConfirmed}>{loading ? 'Dropping...' : 'Drop Table'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
