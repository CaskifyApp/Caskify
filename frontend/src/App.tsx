import { ConnectionList } from '@/components/Sidebar/ConnectionList';

function App() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-64 border-r flex flex-col">
        <div className="p-3 border-b">
          <h1 className="font-semibold text-lg">CaskPG</h1>
          <p className="text-xs text-muted-foreground">PostgreSQL Manager</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <ConnectionList />
        </div>
      </aside>
      <main className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Select a connection to get started</p>
          <p className="text-sm">or create a new one from the sidebar</p>
        </div>
      </main>
    </div>
  );
}

export default App;
