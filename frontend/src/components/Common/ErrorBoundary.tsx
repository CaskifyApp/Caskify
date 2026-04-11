import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('App error boundary caught an error', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-background p-6 text-foreground">
          <div className="max-w-lg rounded-4xl border bg-card p-6 text-center shadow-sm">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The application hit an unexpected UI error. Reload the window to recover the current session.
            </p>
            <pre className="mt-4 overflow-auto rounded-3xl bg-muted/40 p-4 text-left text-xs text-destructive">
              {this.state.errorMessage}
            </pre>
            <div className="mt-4 flex justify-center">
              <Button onClick={() => window.location.reload()}>Reload App</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
