import { create } from 'zustand';
import * as wails from '../../wailsjs/go/main/App';
import type { AppSettings } from '@/types';

interface SettingsState {
  settings: AppSettings;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  defaultRowsPerPage: 50,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,

  loadSettings: async () => {
    const settings = (await wails.GetSettings()) as AppSettings;
    set({ settings });
  },

  updateSettings: async (partial) => {
    const nextSettings = { ...get().settings, ...partial };
    await wails.SaveSettings(nextSettings);
    set({ settings: nextSettings });
  },
}));
