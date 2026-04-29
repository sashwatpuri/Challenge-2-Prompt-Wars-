import { useState } from 'react';
import Chat from './components/Chat';
import Journey from './components/Journey';
import EVMSimulator from './components/EVMSimulator';
import Timeline from './components/Timeline';
import LanguageToggle from './components/LanguageToggle';
import { useGemini } from './hooks/useGemini';

export type Screen = 'onboarding' | 'journey' | 'evm';
export type Language = 'en' | 'hi';

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
  const [language, setLanguage] = useState<Language>('en');
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [userProfile, setUserProfile] = useState<UserProfile>({ onboardingComplete: false });
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const { sendMessage, retrieveAndAnswer } = useGemini();

  return (
    <div className="min-h-screen bg-[var(--color-off-white)] text-gray-900 flex flex-col font-sans">
      <header className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-[var(--color-saffron)]">VoteWise</h1>
        <LanguageToggle language={language} setLanguage={setLanguage} />
      </header>

      <main className="flex-1 relative flex flex-col max-w-4xl mx-auto w-full p-4 gap-6">
        {currentScreen !== 'onboarding' && (
          <div className="w-full">
            <Timeline />
          </div>
        )}

        {currentScreen === 'onboarding' && (
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
        )}

        {currentScreen === 'journey' && (
          <Journey 
            journeySteps={journeySteps}
            setJourneySteps={setJourneySteps}
            setCurrentScreen={setCurrentScreen}
            sendMessage={sendMessage}
            retrieveAndAnswer={retrieveAndAnswer}
          />
        )}

        {currentScreen === 'evm' && (
          <EVMSimulator 
            setCurrentScreen={setCurrentScreen} 
            sendMessage={sendMessage}
            retrieveAndAnswer={retrieveAndAnswer}
          />
        )}
      </main>

      {/* Floating Q&A Assistant */}
      {currentScreen !== 'onboarding' && (
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
      )}
    </div>
  );
}

export default App;
