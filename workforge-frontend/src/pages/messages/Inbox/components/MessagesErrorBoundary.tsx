import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@components/ui/Button';
import { wsMessageService } from '@services/ws-message.service';

interface MessagesErrorBoundaryProps {
  children: React.ReactNode;
}

interface MessagesErrorBoundaryState {
  hasError: boolean;
  errorName?: string;
  errorMessage?: string;
  componentStack?: string;
  recoveryAttempts: number;
}

export class MessagesErrorBoundary extends React.Component<
  MessagesErrorBoundaryProps,
  MessagesErrorBoundaryState
> {
  constructor(props: MessagesErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, recoveryAttempts: 0 };
  }

  static getDerivedStateFromError(): MessagesErrorBoundaryState {
    return { hasError: true, recoveryAttempts: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({
      errorName: error.name,
      errorMessage: error.message,
      componentStack: errorInfo.componentStack,
    });
    console.error('Messages UI error:', error);
  }

  private handleRetry = () => {
    if (this.state.recoveryAttempts >= 3) {
      return;
    }

    localStorage.removeItem('workforge-messages');
    wsMessageService.reconnect();

    this.setState((prev) => ({
      hasError: false,
      errorName: undefined,
      errorMessage: undefined,
      componentStack: undefined,
      recoveryAttempts: prev.recoveryAttempts + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-white bg-gray-900 rounded-lg border border-gray-200 border-gray-800">
          <div className="max-w-md text-center px-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 bg-amber-900/20 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-[#1A1A1A] mb-2">
              Messages temporarily unavailable
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              We hit a runtime issue while loading your inbox. Try again to continue.
            </p>
            {import.meta.env.DEV && (this.state.errorName || this.state.errorMessage) && (
              <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left">
                <p className="text-xs font-semibold text-amber-900 mb-1">Debug details</p>
                <p className="text-xs text-amber-800">
                  {this.state.errorName || 'Error'}: {this.state.errorMessage || 'Unknown runtime error'}
                </p>
                {this.state.componentStack && (
                  <pre className="mt-2 max-h-28 overflow-auto text-[11px] text-amber-800 whitespace-pre-wrap">
                    {this.state.componentStack.trim()}
                  </pre>
                )}
              </div>
            )}
            <Button onClick={this.handleRetry} disabled={this.state.recoveryAttempts >= 3}>
              {this.state.recoveryAttempts >= 3
                ? 'Support Required'
                : `Try Again (${this.state.recoveryAttempts + 1}/3)`}
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
