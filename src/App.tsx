import { useState, lazy, Suspense } from 'react';
import Chat from './components/Chat';
import Journey from './components/Journey';
const EVMSimulator = lazy(() => import('./components/EVMSimulator'));
import Timeline from './components/Timeline';
import LanguageToggle from './components/LanguageToggle';
import { useGemini } from './hooks/useGemini';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useLanguage } from './context/LanguageContext';

const FormWizard = lazy(() => import('./components/FormWizard'));
const BoothLocator = lazy(() => import('./components/BoothLocator'));

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

function App() {
  const { t } = useLanguage();
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [userProfile, setUserProfile] = useState<UserProfile>({ onboardingComplete: false });
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const { sendMessage, retrieveAndAnswer } = useGemini();

  return (
    <div className="min-h-screen bg-[var(--color-off-white)] text-gray-900 flex flex-col font-sans">
      <header className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-[var(--color-saffron)]">{t('app.title')}</h1>
        <LanguageToggle />
      </header>

      <main className="flex-1 relative flex flex-col max-w-4xl mx-auto w-full p-4 gap-6">
        {currentScreen !== 'onboarding' && (
          <div className="w-full">
            <ErrorBoundary fallbackMessage="The timeline encountered an error.">
              <Timeline />
            </ErrorBoundary>
          </div>
        )}

        {currentScreen === 'onboarding' && (
          <ErrorBoundary fallbackMessage="The chat interface encountered an error.">
            <Chat 
              mode="fullscreen"
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              setJourneySteps={setJourneySteps}
              setCurrentScreen={setCurrentScreen}
              sendMessage={sendMessage}
              retrieveAndAnswer={retrieveAndAnswer}
            />
          </ErrorBoundary>
        )}

        {currentScreen === 'journey' && (
          <ErrorBoundary fallbackMessage="The journey view encountered an error.">
            <Journey 
              journeySteps={journeySteps}
              setJourneySteps={setJourneySteps}
              setCurrentScreen={setCurrentScreen}
              sendMessage={sendMessage}
              retrieveAndAnswer={retrieveAndAnswer}
            />
          </ErrorBoundary>
        )}

        {currentScreen === 'evm' && (
          <ErrorBoundary fallbackMessage="The EVM Simulator encountered an error.">
            <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading Simulator...</div>}>
              <EVMSimulator 
                setCurrentScreen={setCurrentScreen} 
                sendMessage={sendMessage}
                retrieveAndAnswer={retrieveAndAnswer}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {currentScreen === 'formWizard' && (
          <ErrorBoundary fallbackMessage="The Form Wizard encountered an error.">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[600px] flex flex-col">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <button 
                  onClick={() => setCurrentScreen('journey')}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  ← Back to Journey
                </button>
              </div>
              <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading Form...</div>}>
                <FormWizard />
              </Suspense>
            </div>
          </ErrorBoundary>
        )}

        {currentScreen === 'boothLocator' && (
          <ErrorBoundary fallbackMessage="The Booth Locator encountered an error.">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[600px] flex flex-col">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <button 
                  onClick={() => setCurrentScreen('journey')}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  ← Back to Journey
                </button>
              </div>
              <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading Locator...</div>}>
                <BoothLocator />
              </Suspense>
            </div>
          </ErrorBoundary>
        )}
      </main>

      {/* Floating Q&A Assistant */}
      {currentScreen !== 'onboarding' && (
        <ErrorBoundary fallbackMessage="The assistant encountered an error.">
          <Chat 
            mode="floating"
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            setJourneySteps={setJourneySteps}
            setCurrentScreen={setCurrentScreen}
            sendMessage={sendMessage}
            retrieveAndAnswer={retrieveAndAnswer}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}

export default App;
