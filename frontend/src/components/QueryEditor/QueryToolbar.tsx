import { useEffect, useMemo, useState } from 'react';
import { History, Play, Save, Square, WandSparkles } from 'lucide-react';
import { format as formatSQL } from 'sql-formatter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QueryTemplates } from '@/components/QueryEditor/QueryTemplates';
import { useConnectionStore } from '@/store/connectionStore';
import type { DatabaseInfo } from '@/types';

interface QueryToolbarProps {
  profileId: string;
  databaseName: string;
  queryText: string;
  running: boolean;
  onProfileChange: (profileId: string) => void;
  onDatabaseChange: (databaseName: string) => void;
  onQueryTextChange: (queryText: string) => void;
  onRun: () => void;
  onCancel: () => void;
  onSave: () => void;
  onShowSavedQueries: () => void;
  onShowHistory: () => void;
  onSelectTemplate: (template: string) => void;
}

export function QueryToolbar({ profileId, databaseName, queryText, running, onProfileChange, onDatabaseChange, onQueryTextChange, onRun, onCancel, onSave, onShowSavedQueries, onShowHistory, onSelectTemplate }: QueryToolbarProps) {
  const profiles = useConnectionStore((state) => state.profiles);
  const connectionStatuses = useConnectionStore((state) => state.connectionStatuses);
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const connectedProfiles = useMemo(
    () => profiles.filter((profile) => connectionStatuses.get(profile.id)?.connected),
    [profiles, connectionStatuses]
  );

  useEffect(() => {
    if (!profileId) {
      setDatabases([]);
      return;
    }

    const profile = profiles.find((item) => item.id === profileId);
    const selectedDatabase = profile?.defaultDatabase ?? profile?.database ?? '';
    if (!selectedDatabase) {
      setDatabases([]);
      return;
    }

    const nextDatabases: DatabaseInfo[] = [{ connectionId: profileId, name: selectedDatabase }];
    setDatabases(nextDatabases);
    if (!databaseName) {
      onDatabaseChange(selectedDatabase);
    }

    return undefined;
  }, [databaseName, onDatabaseChange, profileId, profiles]);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-4xl border bg-card px-4 py-3 shadow-sm">
      <Select value={profileId} onValueChange={(value) => onProfileChange(value ?? '')}>
        <SelectTrigger className="min-w-56">
          <SelectValue placeholder="Choose connection" />
        </SelectTrigger>
        <SelectContent>
          {connectedProfiles.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              {profile.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={databaseName} onValueChange={(value) => onDatabaseChange(value ?? '')}>
        <SelectTrigger className="min-w-48">
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

      {running ? (
        <Button variant="destructive" size="sm" onClick={onCancel}>
          <Square data-icon="inline-start" />
          Cancel
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={onRun} disabled={!profileId || !databaseName}>
          <Play data-icon="inline-start" />
          Run Query
        </Button>
      )}

      <Button variant="outline" size="sm" onClick={onSave} disabled={!queryText.trim()}>
        <Save data-icon="inline-start" />
        Save Query
      </Button>

      <Button variant="outline" size="sm" onClick={onShowSavedQueries}>
        Saved Queries
      </Button>

      <QueryTemplates onSelectTemplate={onSelectTemplate} />

      <Button variant="outline" size="sm" onClick={onShowHistory}>
        <History data-icon="inline-start" />
        History
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          try {
            onQueryTextChange(formatSQL(queryText, { language: 'postgresql' }));
          } catch {
            onQueryTextChange(queryText);
          }
        }}
        disabled={!queryText.trim()}
      >
        <WandSparkles data-icon="inline-start" />
        Format SQL
      </Button>
    </div>
  );
}
