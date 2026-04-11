import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [sslMode, setSslMode] = useState('disable');
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [error, setError] = useState<string | null>(null);

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
      setSslMode(editingProfile.ssl_mode || 'disable');
      setPassword('');
    } else {
      setName(initialProfile?.name ?? 'Local PostgreSQL');
      setHost(initialProfile?.host ?? 'localhost');
      setPort(String(initialProfile?.port ?? 5432));
      setDefaultDatabase(initialProfile?.defaultDatabase ?? 'postgres');
      setUsername(initialProfile?.username ?? 'postgres');
      setPassword('');
      setSslMode(initialProfile?.ssl_mode ?? 'disable');
    }
    setTestStatus('idle');
    setError(null);
  }, [editingProfile, initialProfile, open]);

  const buildConnString = () => {
    const databaseName = defaultDatabase || 'postgres';
    return `postgres://${username}:${password}@${host}:${port}/${databaseName}?sslmode=${sslMode}`;
  };

  const handleTest = async () => {
    setError(null);
    setTestStatus('testing');
    
    try {
      const result = await test(buildConnString());
      if (result) {
        setTestStatus('success');
      } else {
        setTestStatus('failed');
        setError('Connection failed. Please check your credentials.');
      }
    } catch (err) {
      setTestStatus('failed');
      setError(String(err));
    }
  };

  const handleSave = async () => {
    setError(null);
    const profile: Profile = {
      id: editingProfile?.id || '',
      name,
      host,
      port: parseInt(port, 10),
      defaultDatabase,
      username,
      ssl_mode: sslMode,
    };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingProfile ? 'Edit Connection' : 'New Connection'}</DialogTitle>
          <DialogDescription>
            Fill in the server details for your PostgreSQL instance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="My PostgreSQL Server"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="host" className="text-right">Host</Label>
            <Input
              id="host"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="col-span-3"
              placeholder="localhost"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="port" className="text-right">Port</Label>
            <Input
              id="port"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="col-span-3"
              placeholder="5432"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="database" className="text-right">Default DB</Label>
            <Input
              id="database"
              value={defaultDatabase}
              onChange={(e) => setDefaultDatabase(e.target.value)}
              className="col-span-3"
              placeholder="postgres (optional)"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
              placeholder="postgres"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="col-span-3"
              placeholder={editingProfile ? '(unchanged)' : ''}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sslmode" className="text-right">SSL Mode</Label>
            <Select value={sslMode} onValueChange={(value) => setSslMode(value || 'disable')}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disable">disable</SelectItem>
                <SelectItem value="require">require</SelectItem>
                <SelectItem value="verify-ca">verify-ca</SelectItem>
                <SelectItem value="verify-full">verify-full</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {testStatus === 'success' && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 p-2 rounded-lg bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="size-4" />
            Connection successful!
          </div>
        )}

        {testStatus === 'failed' && (
          <div className="flex items-center gap-2 text-sm text-destructive p-2 rounded-lg bg-destructive/10">
            <XCircle className="size-4" />
            {error || 'Connection failed'}
          </div>
        )}

        {error && testStatus !== 'failed' && (
          <div className="text-sm text-destructive">{error}</div>
        )}

        {!editingProfile && !isPasswordValid && (
          <div className="text-sm text-destructive">Password is required for a new connection.</div>
        )}

        <DialogFooter className="flex-row gap-2 justify-end">
          <Button 
            variant="outline" 
            onClick={handleTest} 
            disabled={!host || !username || testing}
            className="gap-2"
          >
            {testing && <Loader2 className="size-4 animate-spin" />}
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid}>
            {editingProfile ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
