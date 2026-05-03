/**
 * ErrorBoundary.test.tsx — React Error Boundary Tests
 *
 * Tests that the ErrorBoundary class component:
 *  1. Renders children normally when no error occurs
 *  2. Displays the fallback UI when a child throws during render
 *  3. Shows the custom fallbackMessage prop in the fallback UI
 *  4. Shows a "Reload Page" button in the fallback UI
 *
 * Note: React intentionally logs caught errors to the console.
 * We suppress console.error during these tests to keep output clean.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// ─── Helper: a component that always throws ────────────────────────────────

const BrokenChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Simulated render error for testing');
  }
  return <p>All good</p>;
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ErrorBoundary', () => {
  // Suppress React's console.error noise during intentional error tests
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.mocked(console.error).mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <BrokenChild shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders the fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <BrokenChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/oops, something went wrong/i)).toBeInTheDocument();
  });

  it('renders the custom fallbackMessage prop in the fallback UI', () => {
    const customMessage = 'The chat component broke unexpectedly.';

    render(
      <ErrorBoundary fallbackMessage={customMessage}>
        <BrokenChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('renders a "Reload Page" button in the fallback UI', () => {
    render(
      <ErrorBoundary>
        <BrokenChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  });

  it('shows the generic fallback text when no fallbackMessage is provided', () => {
    render(
      <ErrorBoundary>
        <BrokenChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(
      screen.getByText(/the application encountered an unexpected error/i)
    ).toBeInTheDocument();
  });
});
