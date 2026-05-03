import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Timeline from './Timeline';
import { LanguageProvider } from '../context/LanguageContext';
import * as geminiHooks from '../hooks/useGemini';

describe('Timeline Component', () => {
  const mockRetrieveAndAnswer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(geminiHooks, 'useGemini').mockReturnValue({
      sendMessage: vi.fn(),
      retrieveAndAnswer: mockRetrieveAndAnswer
    });
  });

  const renderWithProvider = () => {
    return render(
      <LanguageProvider>
        <Timeline />
      </LanguageProvider>
    );
  };

  it('renders timeline phases and allows clicking to load explanation', async () => {
    mockRetrieveAndAnswer.mockResolvedValue('Mock explanation of phase.');
    renderWithProvider();

    expect(screen.getByText(/Election Timeline/i)).toBeInTheDocument();
    
    // Find phase by text, for example 'Voter Registration' or whichever is first
    // In our constants, phases have titles. We can click the first button
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(mockRetrieveAndAnswer).toHaveBeenCalled();
      expect(screen.getByText('Mock explanation of phase.')).toBeInTheDocument();
    });

    // Click again to close
    fireEvent.click(buttons[0]);
    expect(screen.queryByText('Mock explanation of phase.')).not.toBeInTheDocument();
  });
});
