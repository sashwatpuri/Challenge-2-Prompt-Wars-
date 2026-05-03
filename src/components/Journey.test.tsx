/**
 * Journey.test.tsx — Journey Component Tests
 *
 * Tests the personalised voting roadmap component:
 *  1. Renders all journey steps from props
 *  2. Each step's title is visible
 *  3. Clicking the completion toggle marks a step complete
 *  4. "Explain this" button triggers retrieveAndAnswer
 *  5. Quick-action buttons navigate to the correct screens
 *  6. "Share Roadmap" button calls window.open
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Journey from './Journey';
import { LanguageProvider } from '../context/LanguageContext';
import type { JourneyStep, Screen } from '../App';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_STEPS: JourneyStep[] = [
  { id: '1', title: 'Check Eligibility',    description: 'Confirm you meet the criteria.', completed: false },
  { id: '2', title: 'Register to Vote',     description: 'Apply for Voter ID card.',        completed: false },
  { id: '3', title: 'Locate Polling Booth', description: 'Find where to go.',               completed: true  },
];

// ─── Helper ──────────────────────────────────────────────────────────────────

interface RenderProps {
  steps?: JourneyStep[];
  setJourneySteps?: ReturnType<typeof vi.fn>;
  setCurrentScreen?: ReturnType<typeof vi.fn>;
  retrieveAndAnswer?: ReturnType<typeof vi.fn>;
}

function renderJourney({
  steps = MOCK_STEPS,
  setJourneySteps = vi.fn(),
  setCurrentScreen = vi.fn(),
  retrieveAndAnswer = vi.fn().mockResolvedValue('AI explanation here.'),
}: RenderProps = {}) {
  return render(
    <LanguageProvider>
      <Journey
        journeySteps={steps}
        setJourneySteps={setJourneySteps}
        setCurrentScreen={setCurrentScreen as React.Dispatch<React.SetStateAction<Screen>>}
        retrieveAndAnswer={retrieveAndAnswer}
      />
    </LanguageProvider>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Journey', () => {
  it('renders a step card for each journey step', () => {
    renderJourney();
    // All three step titles should be visible
    expect(screen.getByText(/Check Eligibility/)).toBeInTheDocument();
    expect(screen.getByText(/Register to Vote/)).toBeInTheDocument();
    expect(screen.getByText(/Locate Polling Booth/)).toBeInTheDocument();
  });

  it('renders step descriptions', () => {
    renderJourney();
    expect(screen.getByText(/Confirm you meet the criteria/)).toBeInTheDocument();
  });

  it('calls setJourneySteps when the completion toggle is clicked', () => {
    const mockSetSteps = vi.fn();
    renderJourney({ setJourneySteps: mockSetSteps });

    // Click the first step's toggle (aria-label = "Mark complete")
    const toggleButtons = screen.getAllByLabelText(/mark complete|mark incomplete/i);
    fireEvent.click(toggleButtons[0]);

    expect(mockSetSteps).toHaveBeenCalledOnce();
  });

  it('fetches and shows an AI explanation when "Explain this" is clicked', async () => {
    const mockRetrieve = vi.fn().mockResolvedValue('You need to be 18 and a citizen.');
    renderJourney({ retrieveAndAnswer: mockRetrieve });

    const explainButtons = screen.getAllByText(/AI: Explain this/i);
    fireEvent.click(explainButtons[0]);

    await waitFor(() => {
      expect(mockRetrieve).toHaveBeenCalledOnce();
    });

    await waitFor(() => {
      expect(screen.getByText('You need to be 18 and a citizen.')).toBeInTheDocument();
    });
  });

  it('does not re-fetch the explanation when "Explain this" is clicked a second time', async () => {
    const mockRetrieve = vi.fn().mockResolvedValue('Cached explanation.');
    renderJourney({ retrieveAndAnswer: mockRetrieve });

    const explainButtons = screen.getAllByText(/AI: Explain this/i);

    // First click — fetches
    fireEvent.click(explainButtons[0]);
    await waitFor(() => expect(screen.getByText('Cached explanation.')).toBeInTheDocument());

    // Second click — collapses the panel
    fireEvent.click(screen.getAllByText(/Hide explanation/i)[0]);

    // Third click — re-opens, should NOT call retrieveAndAnswer again (cache hit)
    fireEvent.click(screen.getAllByText(/AI: Explain this/i)[0]);
    expect(mockRetrieve).toHaveBeenCalledOnce(); // still only 1 call total
  });

  it('navigates to "formWizard" when "Prepare Form 6" is clicked', () => {
    const mockSetScreen = vi.fn();
    renderJourney({ setCurrentScreen: mockSetScreen });

    fireEvent.click(screen.getByText(/Prepare Form 6/i));
    expect(mockSetScreen).toHaveBeenCalledWith('formWizard');
  });

  it('navigates to "boothLocator" when "Find My Booth" is clicked', () => {
    const mockSetScreen = vi.fn();
    renderJourney({ setCurrentScreen: mockSetScreen });

    fireEvent.click(screen.getByText(/Find My Booth/i));
    expect(mockSetScreen).toHaveBeenCalledWith('boothLocator');
  });

  it('navigates to "evm" when the EVM Simulator button is clicked', () => {
    const mockSetScreen = vi.fn();
    renderJourney({ setCurrentScreen: mockSetScreen });

    fireEvent.click(screen.getByText(/EVM Simulator/i));
    expect(mockSetScreen).toHaveBeenCalledWith('evm');
  });

  it('opens WhatsApp with the share text when "Share Roadmap" is clicked', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderJourney();

    fireEvent.click(screen.getByText(/Share Roadmap/i));
    expect(openSpy).toHaveBeenCalledOnce();
    expect(openSpy.mock.calls[0][0]).toMatch(/^whatsapp:\/\/send/);
  });

  it('renders with zero steps without crashing', () => {
    renderJourney({ steps: [] });
    // No crash — the step list should simply be empty
    expect(screen.queryByLabelText(/mark complete/i)).toBeNull();
  });
});
