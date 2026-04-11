import { useMemo } from 'react';
import { History, Play, Save, WandSparkles } from 'lucide-react';
import { format as formatSQL } from 'sql-formatter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConnectionStore } from '@/store/connectionStore';

interface QueryToolbarProps {
  profileId: string;
  queryText: string;
  running: boolean;
  onProfileChange: (profileId: string) => void;
  onQueryTextChange: (queryText: string) => void;
  onRun: () => void;
  onSave: () => void;
  onShowSavedQueries: () => void;
  onShowHistory: () => void;
}

export function QueryToolbar({ profileId, queryText, running, onProfileChange, onQueryTextChange, onRun, onSave, onShowSavedQueries, onShowHistory }: QueryToolbarProps) {
  const profiles = useConnectionStore((state) => state.profiles);
  const connectionStatuses = useConnectionStore((state) => state.connectionStatuses);
  const connectedProfiles = useMemo(
    () => profiles.filter((profile) => connectionStatuses.get(profile.id)?.connected),
    [profiles, connectionStatuses]
  );

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

      <Button variant="outline" size="sm" onClick={onRun} disabled={!profileId || running}>
        <Play data-icon="inline-start" />
        {running ? 'Running...' : 'Run Query'}
      </Button>

      <Button variant="outline" size="sm" onClick={onSave} disabled={!queryText.trim()}>
        <Save data-icon="inline-start" />
        Save Query
      </Button>

      <Button variant="outline" size="sm" onClick={onShowSavedQueries}>
        Saved Queries
      </Button>

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
