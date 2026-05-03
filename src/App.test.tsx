import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';

// Mock child components that might have heavy initialisation or fetch calls
vi.mock('./components/Chat', () => ({
  default: () => <div data-testid="mock-chat">Chat</div>
}));

vi.mock('./components/Timeline', () => ({
  default: () => <div data-testid="mock-timeline">Timeline</div>
}));

vi.mock('./components/LanguageToggle', () => ({
  default: () => <div data-testid="mock-language-toggle">Toggle</div>
}));

describe('App Component', () => {
  it('renders correctly in onboarding screen initially', () => {
    render(
      <LanguageProvider>
        <App />
      </LanguageProvider>
    );
    
    // Header should be there
    expect(screen.getByText(/VoteWise/i)).toBeInTheDocument();
    
    // In onboarding, the mock chat should be rendered, but NOT the timeline
    expect(screen.getByTestId('mock-chat')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-timeline')).not.toBeInTheDocument();
  });
});
