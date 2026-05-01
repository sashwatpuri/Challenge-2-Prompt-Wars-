import 'regenerator-runtime/runtime';
import { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Send, MessageSquare, ChevronDown, Mic, MicOff } from 'lucide-react';
import type { ChatMessage, UserProfile, JourneyStep, Screen } from '../App';
import { useLanguage } from '../context/LanguageContext';

interface ChatProps {
  mode: 'fullscreen' | 'floating';
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setJourneySteps: React.Dispatch<React.SetStateAction<JourneyStep[]>>;
  setCurrentScreen: React.Dispatch<React.SetStateAction<Screen>>;
  sendMessage: (msg: string, isJourney: boolean) => Promise<string>;
  retrieveAndAnswer: (query: string) => Promise<string>;
}

export default function Chat({
  mode,
  chatHistory,
  setChatHistory,
  userProfile,
  setUserProfile,
  setJourneySteps,
  setCurrentScreen,
  sendMessage,
  retrieveAndAnswer
}: ChatProps) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [usedVoice, setUsedVoice] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (listening && transcript) {
      setInput(transcript);
    }
  }, [transcript, listening]);

  // Onboarding internal state
  const [onboardingStage, setOnboardingStage] = useState<'age' | 'voterId' | 'state' | 'done'>(userProfile.onboardingComplete ? 'done' : 'age');

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isOpen]);

  useEffect(() => {
    if (mode === 'fullscreen' && chatHistory.length === 0) {
      // Initial greeting
      setChatHistory([{
        id: Date.now().toString(),
        role: 'ai',
        text: t('chat.greeting')
      }]);
    }
  }, [mode, chatHistory, setChatHistory, t]);

  const generateJourney = async (profile: UserProfile) => {
    setIsTyping(true);

    const hasId = profile.hasVoterId;
    const isUnderage = profile.age < 18;
    
    let steps: JourneyStep[];
    
    if (isUnderage) {
      steps = [
        { id: '1', title: 'Understand Eligibility', description: 'Learn the criteria required to vote when you turn 18.', completed: false },
        { id: '2', title: 'Learn about Voter ID', description: 'Understand how to apply for your Voter ID card (Form 6) in the future.', completed: false },
        { id: '3', title: 'Explore the EVM', description: 'Try the EVM Simulator to see how voting actually works.', completed: false },
        { id: '4', title: 'Future Polling Booths', description: 'Learn how to locate polling booths when your time comes.', completed: false },
      ];
    } else {
      steps = [
        { id: '1', title: 'Check Eligibility', description: 'Confirm you meet the criteria to vote in India.', completed: !!hasId },
        { id: '2', title: 'Register to Vote', description: 'Apply for your Voter ID card (Form 6).', completed: !!hasId },
        { id: '3', title: 'Verify Voter List', description: 'Check your name on the electoral roll.', completed: false },
        { id: '4', title: 'Prepare Documents', description: 'Gather accepted ID proofs for voting day.', completed: false },
        { id: '5', title: 'Locate Polling Booth', description: 'Find exactly where you need to go to vote.', completed: false },
        { id: '6', title: 'Cast Your Vote', description: 'Understand the EVM process and cast your ballot.', completed: false },
      ];
    }
    
    setTimeout(() => {
      setJourneySteps(steps);
      setIsTyping(false);
    }, 1500); // simulate some delay
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setInput('');
    resetTranscript();
    if (listening) {
      SpeechRecognition.stopListening();
    }
    
    const newHistory = [...chatHistory, { id: Date.now().toString(), role: 'user' as const, text: userText }];
    setChatHistory(newHistory);
    setIsTyping(true);

    if (isOffline) {
      setTimeout(() => {
        setChatHistory([...newHistory, { 
          id: Date.now().toString(), 
          role: 'ai', 
          text: t('error.offline') || "You are currently offline. Please refer to your saved journey steps or the cached procedural guides. Full AI capabilities will resume when you reconnect to the internet." 
        }]);
        setIsTyping(false);
      }, 1000);
      return;
    }

    if (mode === 'fullscreen' && onboardingStage !== 'done') {
      // We are in onboarding
      let nextStage: 'age' | 'voterId' | 'state' | 'done' = onboardingStage;
      let prompt = '';
      let updatedProfile = { ...userProfile };

      if (onboardingStage === 'age') {
        const extractedAge = parseInt(userText) || 18; // simplistic extraction
        updatedProfile.age = extractedAge;
        
        if (extractedAge < 18) {
          updatedProfile.onboardingComplete = true;
          nextStage = 'done';
          prompt = `The user answered their age: "${userText}". Warmly explain that they must be 18 to vote in India, but tell them you have prepared an educational roadmap for them to view below.`;
        } else {
          nextStage = 'voterId';
          prompt = `The user answered their age: "${userText}". Acknowledge it briefly and warmly. Then ask if they already have a Voter ID card.`;
        }
      } else if (onboardingStage === 'voterId') {
        updatedProfile.hasVoterId = userText.toLowerCase().includes('yes') || userText.toLowerCase().includes('have') || userText.toLowerCase().includes('y');
        nextStage = 'state';
        prompt = `The user answered if they have a Voter ID: "${userText}". Acknowledge it nicely. Then ask which Indian state they live in.`;
      } else if (onboardingStage === 'state') {
        updatedProfile.state = userText;
        updatedProfile.onboardingComplete = true;
        nextStage = 'done';
        prompt = `The user answered their state: "${userText}". Acknowledge it enthusiastically. Say you have prepared their personalized roadmap and they can view it by clicking the button below.`;
      }

      setUserProfile(updatedProfile);
      setOnboardingStage(nextStage);

      const aiResponse = await sendMessage(prompt, false);
      setChatHistory([...newHistory, { id: Date.now().toString(), role: 'ai', text: aiResponse }]);
      
      if (usedVoice) {
        const utterance = new SpeechSynthesisUtterance(aiResponse);
        window.speechSynthesis.speak(utterance);
        setUsedVoice(false);
      }
      
      if (nextStage === 'done') {
        generateJourney(updatedProfile);
      } else {
        setIsTyping(false);
      }
    } else {
      // Normal Q&A uses RAG
      const aiResponse = await retrieveAndAnswer(userText);
      setChatHistory([...newHistory, { id: Date.now().toString(), role: 'ai', text: aiResponse }]);
      
      if (usedVoice) {
        const utterance = new SpeechSynthesisUtterance(aiResponse);
        window.speechSynthesis.speak(utterance);
        setUsedVoice(false);
      }
      setIsTyping(false);
    }
  };

  if (mode === 'floating' && !isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-[var(--color-saffron)] text-white shadow-lg hover:bg-orange-500 transition-colors z-50 flex items-center justify-center"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  const containerClasses = mode === 'fullscreen' 
    ? "flex flex-col h-[calc(100vh-120px)] w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    : "fixed bottom-6 right-6 w-[350px] h-[500px] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden z-50";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="bg-[var(--color-navy-blue)] text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <MessageSquare size={20} /> {t('app.title')} AI
          </h2>
          {mode === 'floating' && <p className="text-xs text-blue-200">{t('app.subtitle')}</p>}
        </div>
        {mode === 'floating' && (
          <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-300">
            <ChevronDown size={24} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        aria-live="polite"
        aria-atomic="false"
      >
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-[var(--color-saffron)] text-white rounded-br-none' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-1 bg-white rounded-2xl px-4 py-3 w-fit shadow-sm">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        )}
        {userProfile.onboardingComplete && !isTyping && mode === 'fullscreen' && (
          <div className="flex justify-center mt-6 mb-2">
            <button
              onClick={() => setCurrentScreen('journey')}
              className="px-6 py-2.5 bg-[var(--color-saffron)] text-white font-medium rounded-full hover:bg-orange-600 transition-colors shadow-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              View My Roadmap &rarr;
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center">
        {browserSupportsSpeechRecognition && (
          <button
            onClick={() => {
              if (listening) {
                SpeechRecognition.stopListening();
              } else {
                setUsedVoice(true);
                resetTranscript();
                setInput('');
                SpeechRecognition.startListening({ continuous: true });
              }
            }}
            className={`p-2 rounded-full transition-colors ${
              listening 
                ? 'bg-red-500 text-white animate-pulse shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={listening ? "Stop listening" : "Start voice input"}
          >
            {listening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t('chat.placeholder')}
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-saffron)] transition-all"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="p-2 rounded-full bg-[var(--color-saffron)] text-white disabled:opacity-50 hover:bg-orange-500 transition-colors"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
