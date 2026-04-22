import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, Server, Shield, Database } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Profile } from '@/types';
import { useSaveProfile, useUpdateProfile, useTestConnection } from '@/hooks/useConnection';

interface ConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProfile?: Profile | null;
  initialProfile?: Partial<Profile> | null;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'failed';

export function ConnectionModal({ open, onOpenChange, editingProfile, initialProfile }: ConnectionModalProps) {
  const [name, setName] = useState('');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('5432');
  const [defaultDatabase, setDefaultDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sslMode, setSslMode] = useState('auto');
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const { save } = useSaveProfile();
  const { update } = useUpdateProfile();
  const { test, testing } = useTestConnection();

  useEffect(() => {
    if (editingProfile) {
      setName(editingProfile.name);
      setHost(editingProfile.host);
      setPort(String(editingProfile.port));
      setDefaultDatabase(editingProfile.defaultDatabase ?? '');
      setUsername(editingProfile.username);
      setSslMode(editingProfile.ssl_mode || 'auto');
      setPassword('');
    } else {
      setName(initialProfile?.name ?? 'Local PostgreSQL');
      setHost(initialProfile?.host ?? 'localhost');
      setPort(String(initialProfile?.port ?? 5432));
      setDefaultDatabase(initialProfile?.defaultDatabase ?? 'postgres');
      setUsername(initialProfile?.username ?? 'postgres');
      setPassword('');
      setSslMode(initialProfile?.ssl_mode ?? 'auto');
    }
    setTestStatus('idle');
    setError(null);
    setTestMessage(null);
  }, [editingProfile, initialProfile, open]);

  const buildProfile = (): Profile => ({
    id: editingProfile?.id || '',
    name,
    host,
    port: parseInt(port, 10),
    defaultDatabase,
    username,
    ssl_mode: sslMode === 'auto' ? '' : sslMode,
  });

  const handleTest = async () => {
    setError(null);
    setTestStatus('testing');
    
    try {
      const result = await test({
        profile: buildProfile(),
        password,
      });
      if (result.healthy) {
        setTestStatus('success');
        setTestMessage(result.message);
      } else {
        setTestStatus('failed');
        setError(result.message || 'Connection failed. Please check your credentials.');
      }
    } catch (err) {
      setTestStatus('failed');
      setTestMessage(null);
      setError(String(err));
    }
  };

  const handleSave = async () => {
    setError(null);
    const profile = buildProfile();

    try {
      if (editingProfile) {
        await update(profile, password || undefined);
      } else {
        await save(profile, password);
      }
      onOpenChange(false);
    } catch (err) {
      setError(String(err));
    }
  };

  const isPasswordValid = editingProfile ? true : password.trim().length > 0;
  const isFormValid = name && host && username && isPasswordValid;
  const isCreate = !editingProfile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] overflow-hidden">
        {/* Color-coded header strip */}
        <div className={`h-1 w-full ${isCreate ? 'bg-teal-500' : 'bg-amber-500'}`} />
        
        <DialogHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Server className={`size-4 ${isCreate ? 'text-teal-400' : 'text-amber-400'}`} />
            <DialogTitle>{isCreate ? 'New Connection' : 'Edit Connection'}</DialogTitle>
          </div>
          <DialogDescription>
            PostgreSQL server connection parameters.
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-5 py-2 space-y-4 max-h-[60vh] overflow-auto">
          {/* Connection Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Connection Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My PostgreSQL Server"
              className="h-8 text-sm"
            />
          </div>

          {/* Server Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              <Database className="size-3" />
              Server
            </div>
            <div className="space-y-1.5 rounded-md border border-border/20 bg-muted/10 p-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground/50">Host</label>
                  <Input
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="localhost"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground/50">Port</label>
                  <Input
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="5432"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/50">Default Database</label>
                <Input
                  value={defaultDatabase}
                  onChange={(e) => setDefaultDatabase(e.target.value)}
                  placeholder="postgres"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/50">SSL Mode</label>
                <Select value={sslMode} onValueChange={(value) => setSslMode(value || 'disable')}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">auto</SelectItem>
                    <SelectItem value="disable">disable</SelectItem>
                    <SelectItem value="require">require</SelectItem>
                    <SelectItem value="verify-ca">verify-ca</SelectItem>
                    <SelectItem value="verify-full">verify-full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Authentication Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              <Shield className="size-3" />
              Authentication
            </div>
            <div className="space-y-1.5 rounded-md border border-border/20 bg-muted/10 p-3">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/50">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="postgres"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/50">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingProfile ? '(unchanged)' : ''}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Test Status */}
          {testStatus === 'success' && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
              <CheckCircle2 className="size-3.5 shrink-0" />
              {testMessage || 'Connection successful!'}
            </div>
          )}

          {testStatus === 'failed' && (
            <div className="flex items-center gap-2 rounded-md border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-400">
              <XCircle className="size-3.5 shrink-0" />
              {error || 'Connection failed'}
            </div>
          )}

          {error && testStatus !== 'failed' && (
            <div className="text-xs text-rose-400">{error}</div>
          )}

          {!editingProfile && !isPasswordValid && (
            <div className="text-xs text-rose-400">Password is required for a new connection.</div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleTest} 
            disabled={!host || !username || testing}
            className="gap-1.5"
          >
            {testing && <Loader2 className="size-3 animate-spin" />}
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button 
            size="sm"
            onClick={handleSave} 
            disabled={!isFormValid}
          >
            {editingProfile ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}