/**
 * App.tsx — Root Application Component
 *
 * Manages top-level state and screen routing for VoteWise.
 * Screens flow: onboarding → journey → evm / formWizard / boothLocator
 *
 * Shared state (chatHistory, userProfile, journeySteps) lives here so it
 * persists across screen transitions and is accessible to both the fullscreen
 * chat (onboarding) and the floating assistant (all other screens).
 */

import { useState, lazy, Suspense } from 'react';
import Chat from './components/Chat';
import Journey from './components/Journey';
import Timeline from './components/Timeline';
import LanguageToggle from './components/LanguageToggle';
import { useGemini } from './hooks/useGemini';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useLanguage } from './context/LanguageContext';

// Lazy-loaded screens — only downloaded when the user navigates to them
const EVMSimulator = lazy(() => import('./components/EVMSimulator'));
const FormWizard   = lazy(() => import('./components/FormWizard'));
const BoothLocator = lazy(() => import('./components/BoothLocator'));

// ─── Shared Types ─────────────────────────────────────────────────────────────
// Exported so child components can import them directly from App

export type Screen = 'onboarding' | 'journey' | 'evm' | 'formWizard' | 'boothLocator';

export interface UserProfile {
  age?: number;
  hasVoterId?: boolean;
  state?: string;
  onboardingComplete: boolean;
}

export interface JourneyStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

// ─── Loading Fallbacks ────────────────────────────────────────────────────────

const LazyFallback = ({ label }: { label: string }) => (
  <div className="flex-1 flex items-center justify-center text-gray-400">
    {label}
  </div>
);

// ─── Back Navigation Bar ──────────────────────────────────────────────────────

/** Simple header bar shown on screens inside a card container. */
const BackBar = ({ onBack }: { onBack: () => void }) => (
  <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
    <button
      onClick={onBack}
      className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
    >
      ← Back to Journey
    </button>
  </div>
);

// ─── Card Wrapper ─────────────────────────────────────────────────────────────

/** Wraps a lazy screen in a styled card with a back button. */
const ScreenCard = ({
  onBack,
  fallbackLabel,
  children,
}: {
  onBack: () => void;
  fallbackLabel: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[600px] flex flex-col">
    <BackBar onBack={onBack} />
    <Suspense fallback={<LazyFallback label={fallbackLabel} />}>
      {children}
    </Suspense>
  </div>
);

// ─── App Component ────────────────────────────────────────────────────────────

function App() {
  const { t } = useLanguage();
  const { sendMessage, retrieveAndAnswer } = useGemini();

  // Active screen — drives the main content area
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');

  // Persisted user data collected during onboarding
  const [userProfile, setUserProfile] = useState<UserProfile>({ onboardingComplete: false });

  // Personalised voting steps generated after onboarding completes
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([]);

  // Shared chat history used by both the fullscreen and floating assistants
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Shared Chat props — passed identically to both chat instances
  const chatProps = {
    chatHistory,
    setChatHistory,
    userProfile,
    setUserProfile,
    setJourneySteps,
    setCurrentScreen,
    sendMessage,
    retrieveAndAnswer,
  };

  return (
    <div className="min-h-screen bg-[var(--color-off-white)] text-gray-900 flex flex-col font-sans">
      {/* ── App Header ── */}
      <header className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-[var(--color-saffron)]">{t('appName')}</h1>
        <LanguageToggle />
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 relative flex flex-col max-w-4xl mx-auto w-full p-4 gap-6">

        {/* Election Timeline — shown on all screens except onboarding */}
        {currentScreen !== 'onboarding' && (
          <ErrorBoundary fallbackMessage="The timeline encountered an error.">
            <Timeline />
          </ErrorBoundary>
        )}

        {/* Onboarding: Fullscreen chat that collects user profile */}
        {currentScreen === 'onboarding' && (
          <ErrorBoundary fallbackMessage="The chat interface encountered an error.">
            <Chat mode="fullscreen" {...chatProps} />
          </ErrorBoundary>
        )}

        {/* Journey: Personalised step-by-step voting roadmap */}
        {currentScreen === 'journey' && (
          <ErrorBoundary fallbackMessage="The journey view encountered an error.">
            <Journey
              journeySteps={journeySteps}
              setJourneySteps={setJourneySteps}
              setCurrentScreen={setCurrentScreen}
              retrieveAndAnswer={retrieveAndAnswer}
            />
          </ErrorBoundary>
        )}

        {/* EVM Simulator: Interactive mock voting machine */}
        {currentScreen === 'evm' && (
          <ErrorBoundary fallbackMessage="The EVM Simulator encountered an error.">
            <Suspense fallback={<LazyFallback label="Loading Simulator..." />}>
              <EVMSimulator setCurrentScreen={setCurrentScreen} retrieveAndAnswer={retrieveAndAnswer} />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Form Wizard: Step-by-step Form 6 preparation */}
        {currentScreen === 'formWizard' && (
          <ErrorBoundary fallbackMessage="The Form Wizard encountered an error.">
            <ScreenCard onBack={() => setCurrentScreen('journey')} fallbackLabel="Loading Form...">
              <FormWizard />
            </ScreenCard>
          </ErrorBoundary>
        )}

        {/* Booth Locator: Map-based polling booth finder */}
        {currentScreen === 'boothLocator' && (
          <ErrorBoundary fallbackMessage="The Booth Locator encountered an error.">
            <ScreenCard onBack={() => setCurrentScreen('journey')} fallbackLabel="Loading Locator...">
              <BoothLocator />
            </ScreenCard>
          </ErrorBoundary>
        )}
      </main>

      {/* ── Floating Q&A Assistant ── */}
      {/* Persists across all non-onboarding screens as a collapsed chat bubble */}
      {currentScreen !== 'onboarding' && (
        <ErrorBoundary fallbackMessage="The assistant encountered an error.">
          <Chat mode="floating" {...chatProps} />
        </ErrorBoundary>
      )}
    </div>
  );
}

export default App;
