import { ErrorBoundary } from '@/components/Common/ErrorBoundary';
import { AppShell } from '@/components/Layout/AppShell';

function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}

export default App;
