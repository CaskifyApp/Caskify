import { useState, useEffect } from 'react';
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
}

export function ConnectionModal({ open, onOpenChange, editingProfile }: ConnectionModalProps) {
  const [name, setName] = useState('');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sslMode, setSslMode] = useState('disable');
  const [error, setError] = useState<string | null>(null);

  const { save } = useSaveProfile();
  const { update } = useUpdateProfile();
  const { test } = useTestConnection();

  useEffect(() => {
    if (editingProfile) {
      setName(editingProfile.name);
      setHost(editingProfile.host);
      setPort(String(editingProfile.port));
      setDatabase(editingProfile.database);
      setUsername(editingProfile.username);
      setSslMode(editingProfile.ssl_mode || 'disable');
      setPassword('');
    } else {
      setName('');
      setHost('localhost');
      setPort('5432');
      setDatabase('');
      setUsername('');
      setPassword('');
      setSslMode('disable');
    }
    setError(null);
  }, [editingProfile, open]);

  const buildConnString = () => {
    return `postgres://${username}:${password}@${host}:${port}/${database}?sslmode=${sslMode}`;
  };

  const handleTest = async () => {
    setError(null);
    const success = await test(buildConnString());
    if (!success) {
      setError('Connection failed. Please check your credentials.');
    }
  };

  const handleSave = async () => {
    setError(null);
    const profile: Profile = {
      id: editingProfile?.id || '',
      name,
      host,
      port: parseInt(port, 10),
      database,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingProfile ? 'Edit Connection' : 'New Connection'}</DialogTitle>
          <DialogDescription>
            Fill in the connection details for your PostgreSQL database.
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
              placeholder="My Database"
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
            <Label htmlFor="database" className="text-right">Database</Label>
            <Input
              id="database"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              className="col-span-3"
              placeholder="postgres"
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

        {error && (
          <div className="text-sm text-destructive mb-4">{error}</div>
        )}

        <DialogFooter className="flex-row gap-2 justify-end">
          <Button variant="outline" onClick={handleTest} disabled={!host || !database || !username}>
            Test Connection
          </Button>
          <Button onClick={handleSave} disabled={!name || !host || !database || !username}>
            {editingProfile ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
