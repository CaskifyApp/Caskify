import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateDatabaseDialog, DropDatabaseDialog } from '@/components/Modals/DatabaseAdminDialogs';
import { useConnectionStore } from '@/store/connectionStore';
import { useDeleteProfile, useConnectProfile, useDisconnectProfile } from '@/hooks/useConnection';
import { ConnectionModal } from '@/components/Modals/ConnectionModal';
import { LocalDatabaseSection } from '@/components/Sidebar/LocalDatabaseSection';
import { DockerDatabaseSection } from '@/components/Sidebar/DockerDatabaseSection';
import { CloudConnectionsSection } from '@/components/Sidebar/CloudConnectionsSection';
import { useDiscoveryStore } from '@/store/discoveryStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { useTabStore } from '@/store/tabStore';
import { useState } from 'react';
import type { Profile } from '@/types';

export function ConnectionList() {
  const profiles = useConnectionStore((state) => state.profiles);
  const loadProfiles = useConnectionStore((state) => state.loadProfiles);
  const connectionStatuses = useConnectionStore((state) => state.connectionStatuses);
  const setError = useConnectionStore((state) => state.setError);
  const { remove, deleting } = useDeleteProfile();
  const { connect, connecting } = useConnectProfile();
  const { disconnect, disconnecting } = useDisconnectProfile();
  const openTableTab = useTabStore((state) => state.openTableTab);
  const openQueryTabForConnection = useTabStore((state) => state.openQueryTabForConnection);
  const resetConnectionTree = useSidebarStore((state) => state.resetConnectionTree);
  const loadDatabases = useSidebarStore((state) => state.loadDatabases);
  const saveProfile = useConnectionStore((state) => state.saveProfile);
  const localDatabases = useDiscoveryStore((state) => state.localDatabases);
  const dockerDatabases = useDiscoveryStore((state) => state.dockerDatabases);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [initialProfile, setInitialProfile] = useState<Partial<Profile> | null>(null);
  const [profilePendingDelete, setProfilePendingDelete] = useState<Profile | null>(null);
  const [profileForCreateDatabase, setProfileForCreateDatabase] = useState<Profile | null>(null);
  const [databaseForDrop, setDatabaseForDrop] = useState<{ profile: Profile; databaseName: string } | null>(null);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

	useEffect(() => {
		const handleQuickLocalServer = () => {
			setEditingProfile(null);
			setInitialProfile({
				name: 'Local PostgreSQL',
				host: 'localhost',
				port: 5432,
				defaultDatabase: 'postgres',
				username: 'postgres',
				ssl_mode: 'auto',
			});
			setModalOpen(true);
		};

    window.addEventListener('caskpg:quick-local-server', handleQuickLocalServer);
    return () => window.removeEventListener('caskpg:quick-local-server', handleQuickLocalServer);
  }, []);

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setInitialProfile(null);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingProfile(null);
    setInitialProfile(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!profilePendingDelete) {
      return;
    }

    await remove(profilePendingDelete.id);
    setProfilePendingDelete(null);
  };

  const handleConnect = async (profileId: string) => {
    try {
      await connect(profileId);
    } catch (error) {
      setError(String(error));
    }
  };

  const handleDisconnect = async (profileId: string) => {
    await disconnect(profileId);
    resetConnectionTree(profileId);
  };

  const handleBrowseLocal = async (databaseId: string) => {
    const discovered = localDatabases.find((database) => database.id === databaseId);
    if (!discovered) {
      return;
    }

    const existingProfile = profiles.find((profile) =>
      profile.host === discovered.host
      && profile.port === discovered.port
      && profile.defaultDatabase === discovered.database
      && profile.username === discovered.username,
    );

    const profileInput: Profile = existingProfile ?? {
      id: '',
      name: `Local ${discovered.database}`,
      host: discovered.host,
      port: discovered.port,
      defaultDatabase: discovered.database,
      username: discovered.username,
      ssl_mode: 'auto',
    };

    const targetProfile = existingProfile ?? await saveProfile(profileInput);
    await handleConnect(targetProfile.id);
    await loadDatabases(targetProfile.id, true);
    openQueryTabForConnection(targetProfile.id, discovered.database, discovered.database);
  };

  const handleUseDockerDetails = (databaseId: string) => {
    const discovered = dockerDatabases.find((database) => database.id === databaseId);
    if (!discovered) {
      return;
    }

    setEditingProfile(null);
    setInitialProfile({
      name: `Docker ${discovered.containerName}`,
      host: discovered.host,
      port: discovered.port,
      defaultDatabase: discovered.database,
      username: discovered.username,
      ssl_mode: 'auto',
    });
    setModalOpen(true);
  };

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between border-b px-3 py-3">
				<div>
					<h3 className="font-medium text-sm">Database Sources</h3>
					<p className="text-xs text-muted-foreground">Local, Docker, and cloud PostgreSQL workflows.</p>
				</div>
				<Button variant="outline" size="xs" onClick={handleNew}>
					Add Cloud
				</Button>
			</div>
			
			<div className="flex-1 overflow-y-auto">
				<LocalDatabaseSection onBrowse={handleBrowseLocal} />
				<DockerDatabaseSection onUseDetails={handleUseDockerDetails} />
				<CloudConnectionsSection
					profiles={profiles}
					connectionStatuses={connectionStatuses}
					connecting={connecting}
					disconnecting={disconnecting}
					onCreate={handleNew}
					onEdit={handleEdit}
					onDelete={setProfilePendingDelete}
					onConnect={(profileId) => void handleConnect(profileId)}
					onDisconnect={(profileId) => void handleDisconnect(profileId)}
					onCreateDatabase={setProfileForCreateDatabase}
					onRequestDropDatabase={(profile, databaseName) => setDatabaseForDrop({ profile, databaseName })}
					onTableSelect={openTableTab}
				/>
			</div>

      <ConnectionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingProfile={editingProfile}
        initialProfile={initialProfile}
      />

      <CreateDatabaseDialog
        open={profileForCreateDatabase !== null}
        onOpenChange={(open) => {
          if (!open) setProfileForCreateDatabase(null)
        }}
        profileId={profileForCreateDatabase?.id ?? ''}
        onSuccess={() => {
          if (profileForCreateDatabase) {
            void loadDatabases(profileForCreateDatabase.id, true)
          }
          setProfileForCreateDatabase(null)
        }}
      />

      <DropDatabaseDialog
        open={databaseForDrop !== null}
        onOpenChange={(open) => {
          if (!open) setDatabaseForDrop(null)
        }}
        profileId={databaseForDrop?.profile.id ?? ''}
        databaseName={databaseForDrop?.databaseName ?? ''}
        onSuccess={() => {
          if (databaseForDrop) {
            void loadDatabases(databaseForDrop.profile.id, true)
          }
          setDatabaseForDrop(null)
        }}
      />

      <Dialog
        open={profilePendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setProfilePendingDelete(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete Connection</DialogTitle>
            <DialogDescription>
              {profilePendingDelete
                ? `Delete connection "${profilePendingDelete.name}"? This removes the saved profile and its stored password.`
                : 'Delete this connection?'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 justify-end sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setProfilePendingDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
