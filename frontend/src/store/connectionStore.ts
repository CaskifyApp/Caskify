import { create } from 'zustand';
import type { Profile, ConnectionStatus } from '@/types';
import * as wails from '../../wailsjs/go/main/App';

interface ConnectionState {
  profiles: Profile[];
  activeConnections: Map<string, boolean>;
  connectionStatuses: Map<string, ConnectionStatus>;
  isLoading: boolean;
  error: string | null;
  loadProfiles: () => Promise<void>;
  saveProfile: (profile: Profile) => Promise<Profile>;
  updateProfile: (profile: Profile) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  connectProfile: (id: string) => Promise<void>;
  disconnectProfile: (id: string) => Promise<void>;
  savePassword: (profileId: string, password: string) => Promise<void>;
  getPassword: (profileId: string) => Promise<string>;
  testConnection: (connString: string) => Promise<boolean>;
  setError: (error: string | null) => void;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  profiles: [],
  activeConnections: new Map(),
  connectionStatuses: new Map(),
  isLoading: false,
  error: null,

  loadProfiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const profiles = await wails.GetProfiles();
      set({ profiles, isLoading: false });
      
      const statuses = new Map<string, ConnectionStatus>();
      for (const p of profiles) {
        const connected = await wails.IsProfileConnected(p.id);
        statuses.set(p.id, { profileId: p.id, connected });
      }
      set({ connectionStatuses: statuses });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  saveProfile: async (profile: Profile) => {
    set({ isLoading: true, error: null });
    try {
      const savedProfile = await wails.SaveProfile(profile);
      await get().loadProfiles();
      return savedProfile;
    } catch (err) {
      set({ error: String(err), isLoading: false });
      throw err;
    }
  },

  updateProfile: async (profile: Profile) => {
    set({ isLoading: true, error: null });
    try {
      await wails.UpdateProfile(profile);
      await get().loadProfiles();
    } catch (err) {
      set({ error: String(err), isLoading: false });
      throw err;
    }
  },

  deleteProfile: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await wails.DeleteProfile(id);
      await get().loadProfiles();
    } catch (err) {
      set({ error: String(err), isLoading: false });
      throw err;
    }
  },

  connectProfile: async (id: string) => {
    set({ error: null });
    try {
      await wails.ConnectProfile(id);
      const { activeConnections, connectionStatuses } = get();
      activeConnections.set(id, true);
      connectionStatuses.set(id, { profileId: id, connected: true });
      set({ 
        activeConnections: new Map(activeConnections),
        connectionStatuses: new Map(connectionStatuses)
      });
    } catch (err) {
      const { connectionStatuses } = get();
      connectionStatuses.set(id, { profileId: id, connected: false, error: String(err) });
      set({ 
        error: String(err),
        connectionStatuses: new Map(connectionStatuses)
      });
      throw err;
    }
  },

  disconnectProfile: async (id: string) => {
    try {
      wails.DisconnectProfile(id);
      const { activeConnections, connectionStatuses } = get();
      activeConnections.delete(id);
      connectionStatuses.set(id, { profileId: id, connected: false });
      set({ 
        activeConnections: new Map(activeConnections),
        connectionStatuses: new Map(connectionStatuses)
      });
    } catch (err) {
      set({ error: String(err) });
      throw err;
    }
  },

  savePassword: async (profileId: string, password: string) => {
    try {
      await wails.SavePassword(profileId, password);
    } catch (err) {
      set({ error: String(err) });
      throw err;
    }
  },

  getPassword: async (profileId: string) => {
    try {
      return await wails.GetPassword(profileId);
    } catch (err) {
      set({ error: String(err) });
      throw err;
    }
  },

  testConnection: async (connString: string) => {
    try {
      await wails.TestConnection(connString);
      return true;
    } catch {
      return false;
    }
  },

  setError: (error: string | null) => set({ error }),
}));
