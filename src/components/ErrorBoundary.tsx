/**
 * ErrorBoundary Component
 * Catches React errors in component tree and displays fallback UI
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary to catch and handle React component errors
 *
 * Features:
 * - Catches errors in component tree
 * - Displays user-friendly error message
 * - Provides recovery options (reload, go home)
 * - Logs error details to console
 * - Supports custom fallback UI
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    // Reload the page
    window.location.reload();
  };

  handleGoHome = () => {
    // Reset error state and navigate to home
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-8 h-8" />
                <CardTitle className="text-2xl">Something went wrong</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-gray-600">
                An unexpected error occurred in the application. This has been logged and we
                apologize for the inconvenience.
              </p>

              {this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-mono text-sm text-red-800 font-semibold mb-2">
                    Error: {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-red-700 hover:text-red-900">
                        View stack trace
                      </summary>
                      <pre className="mt-2 text-xs text-red-600 overflow-x-auto whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-900 mb-2">Troubleshooting Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                  <li>Try reloading the page</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Check your internet connection</li>
                  <li>Make sure you have the latest version of the app</li>
                  <li>If the problem persists, contact support</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex gap-3">
              <Button onClick={this.handleReload} variant="primary" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Go to Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
