import { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useConnectionStore } from '@/store/connectionStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, ChevronRight, Settings, Database, Cloud, DatabaseZap, HardDrive, Container, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectionModal } from '@/components/Modals/ConnectionModal';
import caskifyLogo from '@/assets/images/caskify-logo.png';

function getProfileIcon(sourceKind?: string) {
  switch (sourceKind) {
    case 'local':
      return HardDrive;
    case 'docker':
      return Container;
    default:
      return Globe;
  }
}

function getProfileColor(sourceKind?: string) {
  switch (sourceKind) {
    case 'local':
      return 'text-teal-400';
    case 'docker':
      return 'text-amber-400';
    default:
      return 'text-violet-400';
  }
}

export function SetupWizard() {
  const [step, setStep] = useState(1);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const { settings, updateSettings } = useSettingsStore();
  const profiles = useConnectionStore((state) => state.profiles);
  
  const savedProfiles = profiles.filter(p => !p.hidden);

  const handleThemeChange = async (theme: 'light' | 'dark') => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    await updateSettings({ theme });
  };

  const handleSkip = async () => {
    await updateSettings({ wizardCompleted: true });
  };

  const handleFinish = async () => {
    await updateSettings({ wizardCompleted: true });
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const steps = [
    { id: 1, title: 'Welcome', icon: DatabaseZap },
    { id: 2, title: 'Appearance', icon: Settings },
    { id: 3, title: 'Remote Setup', icon: Cloud },
    { id: 4, title: 'Ready', icon: CheckCircle2 },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground selection:bg-primary/30">
      <div className="flex w-[260px] flex-col border-r border-border/40 bg-sidebar text-sidebar-foreground p-6">
          <div className="mb-8 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-primary/10 ring-1 ring-border/30">
            <img src={caskifyLogo} alt="Caskify logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">Caskify</h1>
        </div>

        <div className="flex flex-col gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const active = step === s.id;
            const completed = step > s.id;
            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground",
                  completed && "text-foreground"
                )}
              >
                <Icon className={cn("size-4", active ? "text-primary" : completed ? "text-green-500" : "text-muted-foreground/50")} />
                {s.title}
                {completed && <CheckCircle2 className="ml-auto size-3.5 text-green-500" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto p-12 [contain:layout_paint]">
          <div className="mx-auto max-w-2xl mt-12">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="mb-2 text-3xl font-semibold tracking-tight">Welcome to Caskify</h2>
                <p className="mb-8 text-muted-foreground text-lg">
                  The industrial-grade database client. Let's set up your workspace in just a few steps.
                </p>

                <Card variant="panel" className="bg-card/50">
                  <CardContent className="p-6">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Caskify uses a native-like interface designed for maximum productivity. 
                      You can skip this wizard if you prefer to configure things later in the settings panel.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="mb-2 text-2xl font-semibold tracking-tight">Appearance & Editor</h2>
                <p className="mb-8 text-muted-foreground">Customize your viewing experience.</p>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Theme Preference</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => void handleThemeChange('light')}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:bg-accent",
                          settings.theme === 'light' ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/40 bg-card/50"
                        )}
                      >
                        <div className="h-16 w-full rounded-md border border-border/50 bg-white shadow-sm flex items-center justify-center">
                          <div className="h-full w-1/3 border-r border-zinc-200" />
                          <div className="h-full flex-1 bg-zinc-50" />
                        </div>
                        <span className="text-sm font-medium">Light</span>
                      </button>
                      <button
                        onClick={() => void handleThemeChange('dark')}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:bg-accent",
                          settings.theme === 'dark' ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/40 bg-card/50"
                        )}
                      >
                        <div className="h-16 w-full rounded-md border border-border/50 bg-zinc-950 shadow-sm flex items-center justify-center">
                          <div className="h-full w-1/3 border-r border-zinc-800" />
                          <div className="h-full flex-1 bg-zinc-900" />
                        </div>
                        <span className="text-sm font-medium">Dark</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="mb-2 text-2xl font-semibold tracking-tight">Remote Connections</h2>
                <p className="mb-8 text-muted-foreground">Set up your cloud database access.</p>

                {savedProfiles.length === 0 ? (
                  <Card variant="panel" className="overflow-hidden bg-card/50">
                    <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                      <div className="mb-5 flex size-14 items-center justify-center rounded-xl bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.15)] ring-1 ring-primary/20">
                        <Database className="size-6 text-primary" />
                      </div>
                      <h3 className="mb-2 text-base font-medium">Connect to Remote Database</h3>
                      <p className="mb-8 max-w-[280px] text-sm text-muted-foreground leading-relaxed">
                        Add your PostgreSQL, MySQL, or other supported remote databases now, or do it later from the sidebar.
                      </p>
                      <Button onClick={() => setShowConnectionModal(true)} variant="default" className="shadow-sm">
                        Add Connection Now
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <Card variant="panel" className="bg-card/50">
                      <CardContent className="p-6">
                        <div className="mb-5 flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold">Added Connections</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">These profiles are now saved to your workspace.</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setShowConnectionModal(true)} className="h-8 text-xs">
                            Add Another
                          </Button>
                        </div>
                        <div className="grid gap-2">
                          {savedProfiles.map(profile => {
                            const ProfileIcon = getProfileIcon(profile.sourceKind);
                            const iconColor = getProfileColor(profile.sourceKind);

                            return (
                              <div key={profile.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-background p-3.5 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted/50 ring-1 ring-border/50">
                                    <ProfileIcon className={cn("size-4", iconColor)} />
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[13px] font-semibold leading-none">{profile.name}</span>
                                    <span className="text-[11px] text-muted-foreground">{profile.host}:{profile.port} <span className="opacity-50 mx-1">&bull;</span> {profile.username}</span>
                                  </div>
                                </div>
                                <CheckCircle2 className="size-4 text-emerald-500" />
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500 pt-16">
                <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/30">
                  <CheckCircle2 className="size-10 text-green-500" />
                </div>
                <h2 className="mb-2 text-3xl font-semibold tracking-tight">You're All Set!</h2>
                <p className="max-w-md text-muted-foreground">
                  Caskify is ready. Start querying your databases with a highly-optimized native experience.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/40 bg-card px-8 py-6">
          <div className="flex gap-4">
            {step === 1 && (
              <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground hover:text-foreground">
                Skip Wizard
              </Button>
            )}
            {step > 1 && (
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-4">
            {step < 4 ? (
              <Button onClick={nextStep} className="gap-2">
                Continue <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Finish Setup
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {showConnectionModal && (
        <ConnectionModal 
          open={showConnectionModal} 
          onOpenChange={setShowConnectionModal} 
        />
      )}
    </div>
  );
}
