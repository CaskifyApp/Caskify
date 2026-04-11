import { useEffect } from 'react';
import { Plus, Trash2, Edit2, Plug, PlugZap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useConnectionStore } from '@/store/connectionStore';
import { useDeleteProfile, useConnectProfile, useDisconnectProfile } from '@/hooks/useConnection';
import { ConnectionModal } from '@/components/Modals/ConnectionModal';
import { DatabaseTree } from '@/components/Sidebar/DatabaseTree';
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
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [profilePendingDelete, setProfilePendingDelete] = useState<Profile | null>(null);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingProfile(null);
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
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-medium text-sm">Connections</h3>
        <Button variant="ghost" size="icon-xs" onClick={handleNew}>
          <Plus className="size-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {profiles.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No connections yet.
            <br />
            Click + to add one.
          </div>
        ) : (
          <ul className="p-2">
            {profiles.map((profile) => {
              const status = connectionStatuses.get(profile.id);
              const isConnected = status?.connected || false;
              
              return (
                <li key={profile.id} className="rounded-lg hover:bg-muted/60 group">
                  <div className="flex items-center gap-2 p-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{profile.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {profile.host}:{profile.port}{profile.defaultDatabase ? `/${profile.defaultDatabase}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isConnected ? (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDisconnect(profile.id)}
                          disabled={disconnecting}
                          title="Disconnect"
                        >
                          <PlugZap className="size-3 text-green-500" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleConnect(profile.id)}
                          disabled={connecting}
                          title="Connect"
                        >
                          <Plug className="size-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleEdit(profile)}
                        title="Edit"
                      >
                        <Edit2 className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setProfilePendingDelete(profile)}
                        disabled={deleting}
                        title="Delete"
                      >
                        <Trash2 className="size-3 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <DatabaseTree
                    connectionId={profile.id}
                    connected={isConnected}
                    onTableSelect={openTableTab}
                  />

                  {status?.error ? (
                    <div className="px-3 pb-2 text-xs text-destructive">
                      {status.error}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConnectionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingProfile={editingProfile}
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
