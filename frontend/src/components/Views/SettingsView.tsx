import { useEffect, useMemo, useState } from 'react';
import { Settings2, Database, Keyboard, Info, CheckCircle2, AlertCircle, DatabaseZap } from 'lucide-react';
import * as wails from '../../../wailsjs/go/main/App';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetPanel } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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
    if (!open) return;
    if (!profileId && availableProfiles.length > 0) {
      setProfileId(availableProfiles[0].id);
    }
  }, [availableProfiles, open, profileId]);

  useEffect(() => {
    if (!open || !profileId) return;

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

    return () => { cancelled = true; };
  }, [databaseName, open, profileId, profiles]);

  useEffect(() => {
    if (!restorePreflight || restorePreflight.isEmpty || newDatabaseName) return;
    setNewDatabaseName(`${restorePreflight.databaseName}_restore`);
  }, [newDatabaseName, restorePreflight]);

  useEffect(() => {
    if (!open || !profileId || !databaseName) {
      setRestorePreflight(null);
      return;
    }

    let cancelled = false;
    void wails.CheckDatabaseRestoreTarget({ profileId, database: databaseName }).then((result) => {
      if (!cancelled) setRestorePreflight(result);
    }).catch((error) => {
      if (!cancelled) {
        setRestorePreflight(null);
        setDatabaseActionError(String(error));
      }
    });

    return () => { cancelled = true; };
  }, [databaseName, open, profileId]);

  const runDatabaseAction = async (action: 'export' | 'import') => {
    if (!profileId) { setDatabaseActionError('Choose a server profile first.'); return; }
    if (!databaseName) { setDatabaseActionError('Choose a database first.'); return; }

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
        const nextMessage = normalizedResult.path
          ? `${normalizedResult.message} Saved to ${normalizedResult.path}`
          : normalizedResult.message;
        setDatabaseActionMessage(nextMessage);
        setDatabaseActionWarnings(normalizedResult.warnings ?? []);
      }
    } catch (error) {
      setDatabaseActionError(String(error));
    } finally {
      setDatabaseActionLoading(false);
    }
  };

  const handleCreateDatabase = async () => {
    if (!profileId) { setDatabaseActionError('Choose a server profile first.'); return; }
    if (!newDatabaseName.trim()) { setDatabaseActionError('Enter a database name first.'); return; }

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md lg:max-w-xl">
        <SheetHeader className="border-b border-border/5 bg-background px-6 py-4">
          <SheetTitle className="text-xl font-medium tracking-tight">Preferences</SheetTitle>
        </SheetHeader>

        <SheetPanel className="flex flex-1 flex-col px-6 py-4" scrollFade={false}>
          <Tabs defaultValue="general" className="flex flex-col h-full">
            <TabsList className="mb-6 flex w-fit bg-muted/30 p-1">
              <TabsTrigger value="general" className="flex items-center gap-2 text-xs">
                <Settings2 className="size-3.5" /> General
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center gap-2 text-xs">
                <Database className="size-3.5" /> Backup
              </TabsTrigger>
              <TabsTrigger value="shortcuts" className="flex items-center gap-2 text-xs">
                <Keyboard className="size-3.5" /> Shortcuts
              </TabsTrigger>
              <TabsTrigger value="about" className="flex items-center gap-2 text-xs">
                <Info className="size-3.5" /> About
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="flex-1 space-y-8 animate-in fade-in-50">
              <section className="space-y-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Appearance</h3>
                <div className="overflow-hidden rounded-xl border border-border/10 bg-white/[0.02] shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-[13px] font-medium">App Theme</div>
                      <div className="text-[11px] text-muted-foreground">Select light or dark mode.</div>
                    </div>
                    <div className="flex rounded-lg border border-border/10 bg-black/20 p-0.5">
                      <button 
                        type="button"
                        className={cn("rounded-md px-3 py-1 text-xs font-medium transition-all", settings.theme === 'light' ? 'bg-white/10 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                        onClick={() => void updateSettings({ theme: 'light' })}
                      >
                        Light
                      </button>
                      <button 
                        type="button"
                        className={cn("rounded-md px-3 py-1 text-xs font-medium transition-all", settings.theme === 'dark' ? 'bg-white/10 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                        onClick={() => void updateSettings({ theme: 'dark' })}
                      >
                        Dark
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Query Editor</h3>
                <div className="overflow-hidden rounded-xl border border-border/10 bg-white/[0.02] shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/5 px-4 py-3">
                    <div>
                      <div className="text-[13px] font-medium">Font Size</div>
                      <div className="text-[11px] text-muted-foreground">Adjust the code editor scale.</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={10}
                        max={24}
                        className="h-7 w-16 border-border/20 bg-transparent px-2 text-right text-xs shadow-none focus-visible:ring-1"
                        value={String(settings.editorFontSize)}
                        onChange={(event) => void updateSettings({ editorFontSize: Number(event.target.value) || 14 })}
                      />
                      <span className="text-[11px] text-muted-foreground">px</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-[13px] font-medium">History Limit</div>
                      <div className="text-[11px] text-muted-foreground">Maximum queries kept in memory.</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={10}
                        max={1000}
                        className="h-7 w-20 border-border/20 bg-transparent px-2 text-right text-xs shadow-none focus-visible:ring-1"
                        value={String(settings.historyLimit)}
                        onChange={(event) => void updateSettings({ historyLimit: Number(event.target.value) || 100 })}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Data Tables</h3>
                <div className="overflow-hidden rounded-xl border border-border/10 bg-white/[0.02] shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-[13px] font-medium">Default Rows Per Page</div>
                      <div className="text-[11px] text-muted-foreground">Records fetched per pagination request.</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={25}
                        max={5000}
                        className="h-7 w-20 border-border/20 bg-transparent px-2 text-right text-xs shadow-none focus-visible:ring-1"
                        value={String(settings.defaultRowsPerPage)}
                        onChange={(event) => void updateSettings({ defaultRowsPerPage: Number(event.target.value) || 50 })}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Setup Wizard</h3>
                <div className="overflow-hidden rounded-xl border border-border/10 bg-white/[0.02] shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-[13px] font-medium">Reset Onboarding</div>
                      <div className="text-[11px] text-muted-foreground">Re-run the initial setup wizard.</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          void updateSettings({ wizardCompleted: false });
                          onOpenChange(false);
                        }}
                      >
                        Reset Wizard
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="database" className="flex-1 space-y-6 animate-in fade-in-50">
              <div className="rounded-xl border border-border/10 bg-white/[0.02] p-5 shadow-sm">
                <div className="grid gap-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Target Profile</label>
                      <Select value={profileId} onValueChange={(value) => { setProfileId(value ?? ''); setDatabaseName(''); }}>
                        <SelectTrigger className="h-9 w-full bg-black/20 text-xs shadow-none">
                          <SelectValue placeholder="Choose profile" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProfiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id} className="text-xs">{profile.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Database</label>
                      <Select value={databaseName} onValueChange={(value) => setDatabaseName(value ?? '')}>
                        <SelectTrigger className="h-9 w-full bg-black/20 text-xs shadow-none">
                          <SelectValue placeholder="Choose database" />
                        </SelectTrigger>
                        <SelectContent>
                          {databases.map((db) => (
                            <SelectItem key={db.name} value={db.name} className="text-xs">{db.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border border-border/5 bg-background/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Create Empty Database</span>
                      <span className="text-[10px] text-muted-foreground">For clean SQL restore targets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={newDatabaseName}
                        onChange={(event) => setNewDatabaseName(event.target.value)}
                        placeholder="restore_target"
                        className="h-8 bg-black/20 text-xs shadow-none"
                      />
                      <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={() => void handleCreateDatabase()} disabled={databaseActionLoading || !profileId || !newDatabaseName.trim()}>
                        Create
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 rounded-lg bg-muted/20 px-4 py-3">
                    <div className="flex items-center gap-2">
                      {toolStatus.pg_dump ? <CheckCircle2 className="size-4 text-emerald-400" /> : <AlertCircle className="size-4 text-rose-400" />}
                      <div className="flex flex-col">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">pg_dump</span>
                        <span className="text-xs">{toolStatus.pg_dump ? 'Installed' : 'Missing'}</span>
                      </div>
                    </div>
                    <div className="h-6 w-px bg-border/20" />
                    <div className="flex items-center gap-2">
                      {toolStatus.psql ? <CheckCircle2 className="size-4 text-emerald-400" /> : <AlertCircle className="size-4 text-rose-400" />}
                      <div className="flex flex-col">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">psql</span>
                        <span className="text-xs">{toolStatus.psql ? 'Installed' : 'Missing'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Preflight Checks */}
                  {restorePreflight && !restorePreflight.isEmpty ? (
                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-400">
                      <div className="font-semibold text-rose-300">⚠️ Restore target is not empty</div>
                      <div className="mt-1.5 leading-relaxed opacity-90">
                        Detected {restorePreflight.objectCount} user objects across {restorePreflight.schemaCount} schema(s): {restorePreflight.schemas.join(', ')}. <br/>
                        Full SQL dumps should be restored into an empty database to avoid conflicts.
                      </div>
                    </div>
                  ) : restorePreflight?.isEmpty ? (
                    <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-3 text-xs text-teal-400 flex items-center gap-2">
                      <CheckCircle2 className="size-4" />
                      Restore target looks empty and ready for a full SQL dump.
                    </div>
                  ) : null}

                  {databaseActionError && <div className="text-xs text-rose-400">{databaseActionError}</div>}
                  {databaseActionMessage && <div className="text-xs text-teal-400">{databaseActionMessage}</div>}
                  {databaseActionWarnings.length > 0 && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-400 space-y-1">
                      {databaseActionWarnings.map((warning, i) => <div key={i}>{warning}</div>)}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button variant="outline" className="h-9 w-full bg-background" onClick={() => void runDatabaseAction('export')} disabled={databaseActionLoading || !toolStatus.pg_dump || !databaseName}>
                      Export SQL Dump
                    </Button>
                    <Button variant="action" className="h-9 w-full" onClick={() => void runDatabaseAction('import')} disabled={databaseActionLoading || !toolStatus.psql || !databaseName || !restorePreflight?.isEmpty}>
                      Import SQL Dump
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shortcuts" className="flex-1 space-y-4 animate-in fade-in-50">
              <div className="overflow-hidden rounded-xl border border-border/10 bg-white/[0.02] shadow-sm">
                {[
                  { label: 'New query tab', keys: ['Ctrl', 'T'] },
                  { label: 'Close active tab', keys: ['Ctrl', 'W'] },
                  { label: 'Run query', keys: ['Ctrl', 'Enter'] },
                  { label: 'Save query', keys: ['Ctrl', 'S'] },
                  { label: 'Refresh workspace', keys: ['F5'] },
                ].map((shortcut, i, arr) => (
                  <div key={shortcut.label} className={cn("flex items-center justify-between px-4 py-3", i !== arr.length - 1 && "border-b border-border/5")}>
                    <span className="text-[13px] text-muted-foreground">{shortcut.label}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map(k => (
                        <kbd key={k} className="rounded border border-border/20 bg-black/20 px-2 py-1 text-[10px] font-medium text-foreground">{k}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="about" className="flex-1 animate-in fade-in-50">
               <div className="overflow-hidden rounded-xl border border-border/10 bg-white/[0.02] shadow-sm">
                <div className="flex flex-col items-center justify-center p-8 border-b border-border/5">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 shadow-lg">
                    <DatabaseZap className="size-8 text-white" />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold tracking-tight">Caskify</h2>
                  <p className="mt-1 text-xs text-muted-foreground">The modern PostgreSQL GUI</p>
                </div>
                
                <div className="grid gap-0">
                  <div className="flex justify-between px-4 py-3 border-b border-border/5">
                    <span className="text-[13px] text-muted-foreground">Version</span>
                    <span className="text-[13px] font-medium">v1.0.0-beta2</span>
                  </div>
                  <div className="flex justify-between px-4 py-3 border-b border-border/5">
                    <span className="text-[13px] text-muted-foreground">Platform</span>
                    <span className="text-[13px] font-medium">Linux (Wails)</span>
                  </div>
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-[13px] text-muted-foreground">License</span>
                    <span className="text-[13px] font-medium">MIT</span>
                  </div>
                </div>
               </div>
            </TabsContent>
          </Tabs>
        </SheetPanel>
      </SheetContent>
    </Sheet>
  );
}
