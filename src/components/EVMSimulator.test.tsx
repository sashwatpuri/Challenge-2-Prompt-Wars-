import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EVMSimulator from './EVMSimulator';
import { LanguageProvider } from '../context/LanguageContext';
import { DUMMY_CANDIDATES } from '../constants/electionData';

vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

describe('EVMSimulator Component', () => {
  const mockSetCurrentScreen = vi.fn();
  const mockRetrieveAndAnswer = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderWithProvider = () => {
    return render(
      <LanguageProvider>
        <EVMSimulator 
          setCurrentScreen={mockSetCurrentScreen} 
          retrieveAndAnswer={mockRetrieveAndAnswer} 
        />
      </LanguageProvider>
    );
  };

  it('renders candidates and handles voting interaction', async () => {
    mockRetrieveAndAnswer.mockResolvedValue('Mock EVM debrief.');
    
    renderWithProvider();

    // Verify candidates are rendered
    expect(screen.getByText(DUMMY_CANDIDATES[0].name)).toBeInTheDocument();

    // Click vote button for the first candidate
    const voteButtons = screen.getAllByRole('button', { name: new RegExp(`Vote for ${DUMMY_CANDIDATES[0].name}`, 'i') });
    fireEvent.click(voteButtons[0]);

    // Fast-forward VVPAT animation timer (3000ms)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // We must restore real timers so that waitFor can retry correctly
    vi.useRealTimers();

    // After animation, signature moment should show
    await waitFor(() => {
      expect(screen.getByText(/Your Vote Has Been Counted/i)).toBeInTheDocument();
      expect(mockRetrieveAndAnswer).toHaveBeenCalled();
    }, { timeout: 2000 });

    // Check if the AI debrief is populated
    await waitFor(() => {
      expect(screen.getByText('Mock EVM debrief.')).toBeInTheDocument();
    });

    // Click Back to Journey
    const backButton = screen.getAllByRole('button', { name: /Back to Journey/i }).find(btn => 
      btn.className.includes('bg-transparent')
    );
    if (backButton) {
      fireEvent.click(backButton);
    }

    expect(mockSetCurrentScreen).toHaveBeenCalledWith('journey');
  });
});
