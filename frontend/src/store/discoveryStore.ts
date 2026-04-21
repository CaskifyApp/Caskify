import { create } from 'zustand';
import { EventsOn } from '../../wailsjs/runtime/runtime';
import * as wails from '../../wailsjs/go/main/App';
import type { DockerDatabaseInfo, LocalDatabaseInfo } from '@/types';

const DOCKER_POLL_INTERVAL_MS = 30_000;

interface DiscoveryErrorPayload {
  source: string;
  message: string;
}

interface DiscoveryState {
  localDatabases: LocalDatabaseInfo[];
  dockerDatabases: DockerDatabaseInfo[];
  discoveryErrors: Record<string, string | null>;
  syncing: boolean;
  startSync: () => () => void;
  refreshAll: () => Promise<void>;
  refreshDocker: () => Promise<void>;
  setLocalDatabases: (items: LocalDatabaseInfo[]) => void;
  setDockerDatabases: (items: DockerDatabaseInfo[]) => void;
  setDiscoveryError: (source: string, message: string | null) => void;
}

function sortByLabel<T>(items: T[], getLabel: (item: T) => string) {
  return [...items].sort((left, right) => {
    const leftLabel = getLabel(left);
    const rightLabel = getLabel(right);
    return leftLabel.localeCompare(rightLabel);
  });
}

let stopDiscoverySync: (() => void) | null = null;

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  localDatabases: [],
  dockerDatabases: [],
  discoveryErrors: {},
  syncing: false,

  refreshAll: async () => {
    set({ syncing: true });
    await Promise.allSettled([
      wails.RefreshLocalDiscovery(),
      wails.RefreshDockerDiscovery(),
    ]);
    set({ syncing: false });
  },

  refreshDocker: async () => {
    await Promise.allSettled([wails.RefreshDockerDiscovery()]);
  },

  startSync: () => {
    if (stopDiscoverySync) {
      return stopDiscoverySync;
    }

    const stopLocal = EventsOn('discovery:local.updated', (payload: LocalDatabaseInfo[]) => {
      get().setLocalDatabases(Array.isArray(payload) ? payload : []);
      get().setDiscoveryError('local', null);
    });

    const stopDocker = EventsOn('discovery:docker.updated', (payload: DockerDatabaseInfo[]) => {
      get().setDockerDatabases(Array.isArray(payload) ? payload : []);
      get().setDiscoveryError('docker', null);
    });

    const stopError = EventsOn('discovery:error', (payload: DiscoveryErrorPayload) => {
      if (!payload?.source) {
        return;
      }
      get().setDiscoveryError(payload.source, payload.message || 'Discovery failed.');
    });

    const intervalId = window.setInterval(() => {
      void get().refreshDocker();
    }, DOCKER_POLL_INTERVAL_MS);

    void get().refreshAll();

    stopDiscoverySync = () => {
      window.clearInterval(intervalId);
      stopLocal();
      stopDocker();
      stopError();
      stopDiscoverySync = null;
    };

    return stopDiscoverySync;
  },

  setLocalDatabases: (items) => set({ localDatabases: sortByLabel(items, (item) => item.label) }),
  setDockerDatabases: (items) => set({ dockerDatabases: sortByLabel(items, (item) => item.containerName) }),
  setDiscoveryError: (source, message) => set((state) => ({
    discoveryErrors: {
      ...state.discoveryErrors,
      [source]: message,
    },
  })),
}));
