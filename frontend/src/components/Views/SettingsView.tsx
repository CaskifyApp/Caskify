import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useSettingsStore } from '@/store/settingsStore';

interface SettingsViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsView({ open, onOpenChange }: SettingsViewProps) {
  const settings = useSettingsStore((state) => state.settings);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  useEffect(() => {
    if (open) {
      void loadSettings();
    }
  }, [loadSettings, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          <section className="grid gap-3 rounded-4xl border bg-card p-4 shadow-sm">
            <h3 className="font-medium text-foreground">Appearance</h3>
            <div className="flex items-center gap-2">
              <Button variant={settings.theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => void updateSettings({ theme: 'light' })}>Light</Button>
              <Button variant={settings.theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => void updateSettings({ theme: 'dark' })}>Dark</Button>
            </div>
          </section>

          <section className="grid gap-3 rounded-4xl border bg-card p-4 shadow-sm">
            <h3 className="font-medium text-foreground">Table Preferences</h3>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Default Rows Per Page</label>
              <Input
                type="number"
                min={25}
                max={5000}
                value={String(settings.defaultRowsPerPage)}
                onChange={(event) => void updateSettings({ defaultRowsPerPage: Number(event.target.value) || 50 })}
              />
            </div>
          </section>

          <section className="grid gap-3 rounded-4xl border bg-card p-4 shadow-sm">
            <h3 className="font-medium text-foreground">Shortcuts</h3>
            <div className="grid gap-1 text-sm text-muted-foreground">
              <div>Ctrl+T — New query tab</div>
              <div>Ctrl+W — Close active tab</div>
              <div>Ctrl+Enter — Run query</div>
              <div>Ctrl+S — Save query</div>
              <div>Ctrl+R / F5 — Refresh current workspace</div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
