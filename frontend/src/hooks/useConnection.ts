import { useState, useCallback } from 'react';
import { useConnectionStore } from '@/store/connectionStore';
import type { Profile } from '@/types';

export function useProfiles() {
  const { profiles, loadProfiles, isLoading, error } = useConnectionStore();
  return { profiles, loadProfiles, isLoading, error };
}

export function useSaveProfile() {
  const [saving, setSaving] = useState(false);
  const { saveProfile } = useConnectionStore();

  const save = useCallback(async (profile: Profile, password?: string) => {
    setSaving(true);
    try {
      await saveProfile(profile);
      if (password && profile.id) {
        await useConnectionStore.getState().savePassword(profile.id, password);
      }
    } finally {
      setSaving(false);
    }
  }, [saveProfile]);

  return { save, saving };
}

export function useUpdateProfile() {
  const [updating, setUpdating] = useState(false);
  const { updateProfile } = useConnectionStore();

  const update = useCallback(async (profile: Profile, newPassword?: string) => {
    setUpdating(true);
    try {
      await updateProfile(profile);
      if (newPassword && profile.id) {
        await useConnectionStore.getState().savePassword(profile.id, newPassword);
      }
    } finally {
      setUpdating(false);
    }
  }, [updateProfile]);

  return { update, updating };
}

export function useDeleteProfile() {
  const [deleting, setDeleting] = useState(false);
  const { deleteProfile } = useConnectionStore();

  const remove = useCallback(async (id: string) => {
    setDeleting(true);
    try {
      await deleteProfile(id);
    } finally {
      setDeleting(false);
    }
  }, [deleteProfile]);

  return { remove, deleting };
}

export function useTestConnection() {
  const [testing, setTesting] = useState(false);
  const { testConnection } = useConnectionStore();

  const test = useCallback(async (connString: string) => {
    setTesting(true);
    try {
      return await testConnection(connString);
    } finally {
      setTesting(false);
    }
  }, [testConnection]);

  return { test, testing };
}

export function useConnectProfile() {
  const [connecting, setConnecting] = useState(false);
  const { connectProfile, connectionStatuses } = useConnectionStore();

  const connect = useCallback(async (profileId: string) => {
    setConnecting(true);
    try {
      await connectProfile(profileId);
    } finally {
      setConnecting(false);
    }
  }, [connectProfile]);

  const getStatus = useCallback((profileId: string) => {
    return connectionStatuses.get(profileId);
  }, [connectionStatuses]);

  return { connect, connecting, getStatus };
}

export function useDisconnectProfile() {
  const [disconnecting, setDisconnecting] = useState(false);
  const { disconnectProfile } = useConnectionStore();

  const disconnect = useCallback(async (profileId: string) => {
    setDisconnecting(true);
    try {
      await disconnectProfile(profileId);
    } finally {
      setDisconnecting(false);
    }
  }, [disconnectProfile]);

  return { disconnect, disconnecting };
}
