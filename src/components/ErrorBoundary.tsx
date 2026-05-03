/**
 * ErrorBoundary.tsx — Top-Level Error Boundary
 *
 * A class-based React error boundary that catches unhandled render errors
 * in any child component tree. When an error is caught it displays a styled
 * fallback UI with a "Reload Page" action.
 *
 * Usage:
 *   <ErrorBoundary fallbackMessage="Something went wrong in this section.">
 *     <MyComponent />
 *   </ErrorBoundary>
 *
 * Notes:
 *  - Must be a class component — React doesn't yet support error boundaries in functions.
 *  - Wraps individual sections rather than the whole app so one broken screen
 *    doesn't take down the entire UI.
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

// ─── Props & State Types ──────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
  /** Custom message shown in the fallback UI. Falls back to a generic string. */
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  /** Called by React when a descendant throws during rendering. */
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /** Ideal place to log errors to an external service (e.g. Sentry, Cloud Logging). */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 text-red-800 rounded-lg border border-red-200 shadow-sm w-full h-full min-h-[200px]">
          <h2 className="text-xl font-bold mb-2">Oops, something went wrong</h2>
          <p className="text-sm opacity-80 mb-4 text-center">
            {this.props.fallbackMessage || 'The application encountered an unexpected error.'}
          </p>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
