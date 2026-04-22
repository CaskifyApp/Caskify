import { ErrorBoundary } from '@/components/Common/ErrorBoundary';
import { AppShell } from '@/components/Layout/AppShell';
import { TooltipProvider } from '@/components/ui/tooltip';

function App() {
  return (
    <TooltipProvider>
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    </TooltipProvider>
  );
}

export default App;
