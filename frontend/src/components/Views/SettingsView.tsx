import { useEffect, useMemo, useState } from 'react';
import * as wails from '../../../wailsjs/go/main/App';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConnectionStore } from '@/store/connectionStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { DatabaseInfo, DatabaseOperationResult, DatabaseRestorePreflightResult } from '@/types';

interface SettingsViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsView({ open, onOpenChange }: SettingsViewProps) {
  const settings = useSettingsStore((state) => state.settings);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const profiles = useConnectionStore((state) => state.profiles);
  const connectionStatuses = useConnectionStore((state) => state.connectionStatuses);
  const [profileId, setProfileId] = useState('');
  const [databaseName, setDatabaseName] = useState('');
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [toolStatus, setToolStatus] = useState<Record<string, boolean>>({ pg_dump: false, psql: false });
  const [databaseActionError, setDatabaseActionError] = useState<string | null>(null);
  const [databaseActionMessage, setDatabaseActionMessage] = useState<string | null>(null);
  const [databaseActionWarnings, setDatabaseActionWarnings] = useState<string[]>([]);
  const [databaseActionLoading, setDatabaseActionLoading] = useState(false);
  const [restorePreflight, setRestorePreflight] = useState<DatabaseRestorePreflightResult | null>(null);
  const [newDatabaseName, setNewDatabaseName] = useState('');

  const availableProfiles = useMemo(
    () => profiles.filter((profile) => connectionStatuses.get(profile.id)?.connected || profile.host === 'localhost'),
    [profiles, connectionStatuses]
  );

  useEffect(() => {
    if (open) {
      void loadSettings();
      void wails.CheckDatabaseTools().then((status) => setToolStatus(status)).catch((error) => setDatabaseActionError(String(error)));
    }
  }, [loadSettings, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!profileId && availableProfiles.length > 0) {
      setProfileId(availableProfiles[0].id);
    }
  }, [availableProfiles, open, profileId]);

  useEffect(() => {
    if (!open || !profileId) {
      return;
    }

    let cancelled = false;
    const profile = profiles.find((item) => item.id === profileId);
    void wails.GetDatabases(profileId).then((items) => {
      if (!cancelled) {
        const nextDatabases = items ?? [];
        setDatabases(nextDatabases);
        if (!databaseName && nextDatabases.length > 0) {
          const preferredDatabase = profile?.defaultDatabase;
          const nextDatabase = nextDatabases.find((item) => item.name === preferredDatabase)?.name ?? nextDatabases[0].name;
          setDatabaseName(nextDatabase);
        }
      }
    }).catch((error) => {
      if (!cancelled) {
        setDatabases([]);
        setDatabaseActionError(String(error));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [databaseName, open, profileId, profiles]);

  useEffect(() => {
    if (!open || !profileId || !databaseName) {
      setRestorePreflight(null);
      return;
    }

    let cancelled = false;
    void wails.CheckDatabaseRestoreTarget({ profileId, database: databaseName }).then((result) => {
      if (!cancelled) {
        setRestorePreflight(result);
      }
    }).catch((error) => {
      if (!cancelled) {
        setRestorePreflight(null);
        setDatabaseActionError(String(error));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [databaseName, open, profileId]);

  const runDatabaseAction = async (action: 'export' | 'import') => {
    if (!profileId) {
      setDatabaseActionError('Choose a server profile first.');
      return;
    }
    if (!databaseName) {
      setDatabaseActionError('Choose a database first.');
      return;
    }

    setDatabaseActionLoading(true);
    setDatabaseActionError(null);
    setDatabaseActionMessage(null);
    setDatabaseActionWarnings([]);

    try {
      const result = action === 'export'
        ? await wails.ExportDatabaseSQL({ profileId, database: databaseName })
        : await wails.ImportDatabaseSQL({ profileId, database: databaseName });

      if (result) {
        const normalizedResult = result as DatabaseOperationResult;
        setDatabaseActionMessage(normalizedResult.message);
        setDatabaseActionWarnings(normalizedResult.warnings ?? []);
      }
    } catch (error) {
      setDatabaseActionError(String(error));
    } finally {
      setDatabaseActionLoading(false);
    }
  };

  const handleCreateDatabase = async () => {
    if (!profileId) {
      setDatabaseActionError('Choose a server profile first.');
      return;
    }
    if (!newDatabaseName.trim()) {
      setDatabaseActionError('Enter a database name first.');
      return;
    }

    setDatabaseActionLoading(true);
    setDatabaseActionError(null);
    setDatabaseActionMessage(null);
    setDatabaseActionWarnings([]);

    try {
      await wails.CreateEmptyDatabase({ profileId, name: newDatabaseName.trim() });
      const nextDatabases = (await wails.GetDatabases(profileId)) as DatabaseInfo[];
      setDatabases(nextDatabases ?? []);
      setDatabaseName(newDatabaseName.trim());
      setNewDatabaseName('');
      setDatabaseActionMessage('Empty database created successfully.');
    } catch (error) {
      setDatabaseActionError(String(error));
    } finally {
      setDatabaseActionLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          <section className="grid gap-3 rounded-4xl border bg-card p-4 shadow-sm">
            <h3 className="font-medium text-foreground">Appearance</h3>
            <div className="flex items-center gap-2">
              <Button variant={settings.theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => void updateSettings({ theme: 'light' })}>Light</Button>
              <Button variant={settings.theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => void updateSettings({ theme: 'dark' })}>Dark</Button>
            </div>
          </section>

          <section className="grid gap-3 rounded-4xl border bg-card p-4 shadow-sm">
            <h3 className="font-medium text-foreground">Table Preferences</h3>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Default Rows Per Page</label>
              <Input
                type="number"
                min={25}
                max={5000}
                value={String(settings.defaultRowsPerPage)}
                onChange={(event) => void updateSettings({ defaultRowsPerPage: Number(event.target.value) || 50 })}
              />
            </div>
          </section>

          <section className="grid gap-3 rounded-4xl border bg-card p-4 shadow-sm">
            <h3 className="font-medium text-foreground">Shortcuts</h3>
            <div className="grid gap-1 text-sm text-muted-foreground">
              <div>Ctrl+T — New query tab</div>
              <div>Ctrl+W — Close active tab</div>
              <div>Ctrl+Enter — Run query</div>
              <div>Ctrl+S — Save query</div>
              <div>Ctrl+R / F5 — Refresh current workspace</div>
            </div>
          </section>

          <section className="grid gap-3 rounded-4xl border bg-card p-4 shadow-sm">
            <h3 className="font-medium text-foreground">Database Backup & Restore</h3>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Server Profile</label>
              <Select value={profileId} onValueChange={(value) => {
                setProfileId(value ?? '');
                setDatabaseName('');
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose server profile" />
                </SelectTrigger>
                <SelectContent>
                  {availableProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Database</label>
              <Select value={databaseName} onValueChange={(value) => setDatabaseName(value ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose database" />
                </SelectTrigger>
                <SelectContent>
                  {databases.map((database) => (
                    <SelectItem key={database.name} value={database.name}>
                      {database.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Create Empty Database</label>
              <div className="flex items-center gap-2">
                <Input
                  value={newDatabaseName}
                  onChange={(event) => setNewDatabaseName(event.target.value)}
                  placeholder="wiradoor_restore"
                />
                <Button variant="outline" onClick={() => void handleCreateDatabase()} disabled={databaseActionLoading || !profileId || !newDatabaseName.trim()}>
                  Create
                </Button>
              </div>
            </div>

            <div className="grid gap-1 text-sm text-muted-foreground">
              <div>pg_dump: {toolStatus.pg_dump ? 'available' : 'missing'}</div>
              <div>psql: {toolStatus.psql ? 'available' : 'missing'}</div>
            </div>

            {restorePreflight && !restorePreflight.isEmpty ? (
              <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <div className="font-medium">Restore target is not empty.</div>
                <div className="mt-1">Schemas already present: {restorePreflight.schemas.join(', ')}</div>
                <div className="mt-1 text-xs">Full SQL dumps should be restored into an empty database.</div>
              </div>
            ) : null}

            {restorePreflight?.isEmpty ? (
              <div className="rounded-3xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
                Restore target looks empty and ready for a full SQL dump.
              </div>
            ) : null}

            {databaseActionError ? <div className="text-sm text-destructive">{databaseActionError}</div> : null}
            {databaseActionMessage ? <div className="text-sm text-primary">{databaseActionMessage}</div> : null}
            {databaseActionWarnings.length > 0 ? (
              <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-300">
                {databaseActionWarnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => void runDatabaseAction('export')} disabled={databaseActionLoading || !toolStatus.pg_dump || !databaseName}>
                Export SQL
              </Button>
              <Button variant="outline" onClick={() => void runDatabaseAction('import')} disabled={databaseActionLoading || !toolStatus.psql || !databaseName || !restorePreflight?.isEmpty}>
                Import SQL
              </Button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
