import { useMemo, useState } from 'react';
import { Play, Square, Save, FileCode, Clock, Wand2, ChevronDown, HardDrive, Container, Globe } from 'lucide-react';
import { format as formatSQL } from 'sql-formatter';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useConnectionStore } from '@/store/connectionStore';
import { useDiscoveryStore } from '@/store/discoveryStore';
import type { Profile } from '@/types';

interface UnifiedTarget {
  id: string;
  label: string;
  profileId: string;
  databaseName: string;
  sourceKind: 'local' | 'docker' | 'cloud';
  profile: Profile;
}

function getSourceIcon(sourceKind: string) {
  switch (sourceKind) {
    case 'local': return HardDrive;
    case 'docker': return Container;
    default: return Globe;
  }
}

function getSourceColor(sourceKind: string) {
  switch (sourceKind) {
    case 'local': return 'text-teal-400';
    case 'docker': return 'text-amber-400';
    default: return 'text-violet-400';
  }
}

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

export function QueryToolbar({
  profileId,
  databaseName,
  queryText,
  running,
  onProfileChange,
  onDatabaseChange,
  onQueryTextChange,
  onRun,
  onCancel,
  onSave,
  onShowSavedQueries,
  onShowHistory,
  onSelectTemplate,
}: QueryToolbarProps) {
  const profiles = useConnectionStore((state) => state.profiles);
  const connectionStatuses = useConnectionStore((state) => state.connectionStatuses);
  const localDatabases = useDiscoveryStore((state) => state.localDatabases);
  const dockerDatabases = useDiscoveryStore((state) => state.dockerDatabases);
  const [targetsOpen, setTargetsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const connectedProfiles = useMemo(
    () => profiles.filter((p) => connectionStatuses.get(p.id)?.connected || (!p.hidden && p.host === 'localhost')),
    [profiles, connectionStatuses]
  );

  const unifiedTargets = useMemo(() => {
    const items: UnifiedTarget[] = [];

    for (const local of localDatabases) {
      const matchingProfile = profiles.find((p) => p.host === local.host && p.port === local.port && p.username === local.username);
      if (matchingProfile) {
        items.push({
          id: `local-${local.id}`,
          label: local.database,
          profileId: matchingProfile.id,
          databaseName: local.database,
          sourceKind: 'local',
          profile: matchingProfile,
        });
      }
    }

    for (const docker of dockerDatabases) {
      const matchingProfile = profiles.find((p) => p.host === docker.host && p.port === docker.port);
      if (matchingProfile) {
        items.push({
          id: `docker-${docker.id}`,
          label: `${docker.containerName} | ${docker.database}`,
          profileId: matchingProfile.id,
          databaseName: docker.database,
          sourceKind: 'docker',
          profile: matchingProfile,
        });
      }
    }

    for (const profile of connectedProfiles) {
      if (profile.hidden) continue;
      const dbName = profile.defaultDatabase || profile.database || 'postgres';
      items.push({
        id: `cloud-${profile.id}`,
        label: `${profile.name} | ${dbName}`,
        profileId: profile.id,
        databaseName: dbName,
        sourceKind: 'cloud',
        profile,
      });
    }

    return items;
  }, [localDatabases, dockerDatabases, connectedProfiles, profiles]);

  const currentTarget = useMemo(() => {
    return unifiedTargets.find((t) => t.profileId === profileId && t.databaseName === databaseName);
  }, [unifiedTargets, profileId, databaseName]);

  const handleSelectTarget = (target: UnifiedTarget) => {
    onProfileChange(target.profileId);
    onDatabaseChange(target.databaseName);
    setTargetsOpen(false);
  };

  const handleFormatSQL = () => {
    try {
      onQueryTextChange(formatSQL(queryText, { language: 'postgresql' }));
    } catch {
      onQueryTextChange(queryText);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/20 bg-background px-3 py-1.5">
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setTargetsOpen(!targetsOpen)}
            className="flex items-center gap-2 rounded-md border border-border/30 bg-muted/20 px-3 py-1 text-xs font-medium transition-colors hover:bg-muted/40"
          >
            {currentTarget ? (
              <>
                {(() => {
                  const Icon = getSourceIcon(currentTarget.sourceKind);
                  const color = getSourceColor(currentTarget.sourceKind);
                  return <Icon className={`size-3 ${color}`} />;
                })()}
                <span className="max-w-48 truncate">{currentTarget.label}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Select target</span>
            )}
            <ChevronDown className={`size-3 text-muted-foreground transition-transform ${targetsOpen ? 'rotate-180' : ''}`} />
          </button>

          {targetsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setTargetsOpen(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-border/10 bg-popover p-1 shadow-lg">
                <div className="max-h-72 overflow-auto">
                  {unifiedTargets.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">No connected targets</div>
                  ) : (
                    unifiedTargets.map((target) => {
                      const Icon = getSourceIcon(target.sourceKind);
                      const color = getSourceColor(target.sourceKind);
                      const isActive = target.profileId === profileId && target.databaseName === databaseName;

                      return (
                        <button
                          key={target.id}
                          type="button"
                          onClick={() => handleSelectTarget(target)}
                          className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                            isActive ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <Icon className={`size-3 shrink-0 ${color}`} />
                          <span className="min-w-0 flex-1 truncate">{target.label}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {running ? (
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-rose-400" onClick={onCancel}>
            <Square className="size-3" />
            Stop
          </Button>
        ) : (
          <Button variant="action" size="sm" className="h-7 gap-1.5 text-xs" onClick={onRun} disabled={!profileId || !databaseName}>
            <Play className="size-3" />
            Run
          </Button>
        )}

        <Tooltip>
          <TooltipTrigger>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFormatSQL} disabled={!queryText.trim()}>
              <Wand2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Format SQL</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSave} disabled={!queryText.trim()}>
              <Save className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save Query</TooltipContent>
        </Tooltip>

        <div className="relative">
          <Tooltip>
            <TooltipTrigger>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setTemplatesOpen(!templatesOpen)}>
                <FileCode className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Templates</TooltipContent>
          </Tooltip>

          {templatesOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setTemplatesOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-border/10 bg-popover p-1 shadow-lg">
                <div className="max-h-80 overflow-auto">
                  <TemplateCategory
                    title="SELECT"
                    items={[
                      { name: 'Select All', template: 'SELECT * FROM table_name LIMIT 100;' },
                      { name: 'Select with WHERE', template: "SELECT * FROM table_name WHERE column_name = 'value';" },
                      { name: 'Select with JOIN', template: 'SELECT a.*, b.column_name\nFROM table_a a\nJOIN table_b b ON a.id = b.a_id\nWHERE a.active = true;' },
                      { name: 'Select with Aggregation', template: 'SELECT column_name, COUNT(*) as count\nFROM table_name\nGROUP BY column_name\nORDER BY count DESC;' },
                    ]}
                    onSelect={(t) => { onSelectTemplate(t); setTemplatesOpen(false); }}
                  />
                  <TemplateCategory
                    title="INSERT"
                    items={[
                      { name: 'Insert Single Row', template: "INSERT INTO table_name (column1, column2)\nVALUES ('value1', 'value2');" },
                      { name: 'Insert with RETURNING', template: "INSERT INTO table_name (column1, column2)\nVALUES ('value1', 'value2')\nRETURNING *;" },
                      { name: 'Insert Multiple Rows', template: "INSERT INTO table_name (column1, column2)\nVALUES\n  ('value1', 'value2'),\n  ('value3', 'value4'),\n  ('value5', 'value6');" },
                    ]}
                    onSelect={(t) => { onSelectTemplate(t); setTemplatesOpen(false); }}
                  />
                  <TemplateCategory
                    title="UPDATE"
                    items={[
                      { name: 'Update Single Column', template: "UPDATE table_name\nSET column_name = 'new_value'\nWHERE id = 1;" },
                      { name: 'Update Multiple Columns', template: "UPDATE table_name\nSET column1 = 'value1', column2 = 'value2'\nWHERE id = 1;" },
                      { name: 'Update with RETURNING', template: "UPDATE table_name\nSET column_name = 'new_value'\nWHERE id = 1\nRETURNING *;" },
                    ]}
                    onSelect={(t) => { onSelectTemplate(t); setTemplatesOpen(false); }}
                  />
                  <TemplateCategory
                    title="DELETE"
                    items={[
                      { name: 'Delete with WHERE', template: 'DELETE FROM table_name\nWHERE column_name = \'value\';' },
                      { name: 'Delete with RETURNING', template: 'DELETE FROM table_name\nWHERE id = 1\nRETURNING *;' },
                    ]}
                    onSelect={(t) => { onSelectTemplate(t); setTemplatesOpen(false); }}
                  />
                  <TemplateCategory
                    title="DDL"
                    items={[
                      { name: 'Create Table', template: 'CREATE TABLE table_name (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(255) NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);' },
                      { name: 'Create Index', template: 'CREATE INDEX idx_table_name_column\nON table_name (column_name);' },
                      { name: 'Alter Table Add Column', template: 'ALTER TABLE table_name\nADD COLUMN new_column VARCHAR(255);' },
                    ]}
                    onSelect={(t) => { onSelectTemplate(t); setTemplatesOpen(false); }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onShowHistory}>
              <Clock className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>History</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onShowSavedQueries}>
              <FileCode className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Saved Queries</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

interface TemplateItem {
  name: string;
  template: string;
}

interface TemplateCategoryProps {
  title: string;
  items: TemplateItem[];
  onSelect: (template: string) => void;
}

function TemplateCategory({ title, items, onSelect }: TemplateCategoryProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-0.5">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
      >
        {title}
        <ChevronDown className={`size-3 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="ml-2 mt-0.5 space-y-0.5 border-l border-border/10 pl-2">
          {items.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => onSelect(item.template)}
              className="w-full rounded px-2 py-1 text-left text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
