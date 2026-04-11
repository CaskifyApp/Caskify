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

function normalizeSettings(settings: AppSettings): AppSettings {
  return {
    theme: settings.theme === 'light' ? 'light' : 'dark',
    defaultRowsPerPage: Math.min(5000, Math.max(25, settings.defaultRowsPerPage || DEFAULT_SETTINGS.defaultRowsPerPage)),
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,

  loadSettings: async () => {
    const settings = normalizeSettings((await wails.GetSettings()) as AppSettings);
    set({ settings });
  },

  updateSettings: async (partial) => {
    const nextSettings = normalizeSettings({ ...get().settings, ...partial });
    await wails.SaveSettings(nextSettings);
    set({ settings: nextSettings });
  },
}));
