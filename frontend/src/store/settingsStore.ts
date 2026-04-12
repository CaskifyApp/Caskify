import { create } from 'zustand';
import * as wails from '../../wailsjs/go/main/App';
import type { AppSettings } from '@/types';

interface SettingsState {
  settings: AppSettings;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
}

function getPreferredTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: getPreferredTheme(),
  defaultRowsPerPage: 50,
  editorFontSize: 14,
  historyLimit: 100,
};

function normalizeSettings(settings: AppSettings): AppSettings {
  return {
    theme: settings.theme === 'light' ? 'light' : 'dark',
    defaultRowsPerPage: Math.min(5000, Math.max(25, settings.defaultRowsPerPage || DEFAULT_SETTINGS.defaultRowsPerPage)),
    editorFontSize: Math.min(24, Math.max(10, settings.editorFontSize || DEFAULT_SETTINGS.editorFontSize)),
    historyLimit: Math.min(1000, Math.max(10, settings.historyLimit || DEFAULT_SETTINGS.historyLimit)),
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
