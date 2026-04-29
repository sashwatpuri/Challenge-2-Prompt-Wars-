import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ChevronDown } from 'lucide-react';
import type { ChatMessage, UserProfile, JourneyStep, Screen } from '../App';

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
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Onboarding internal state
  const [onboardingStage, setOnboardingStage] = useState<'age' | 'voterId' | 'state' | 'done'>(userProfile.onboardingComplete ? 'done' : 'age');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isOpen]);

  useEffect(() => {
    if (mode === 'fullscreen' && chatHistory.length === 0) {
      // Initial greeting
      setChatHistory([{
        id: Date.now().toString(),
        role: 'ai',
        text: "Namaste! Welcome to VoteWise, your personal election guide. I'm here to make voting easy. To get started, how old are you?"
      }]);
    }
  }, [mode, chatHistory, setChatHistory]);

  const generateJourney = async (profile: UserProfile) => {
    setIsTyping(true);
    setChatHistory(prev => [...prev, {
      id: Date.now().toString(),
      role: 'ai',
      text: "Perfect! I'm creating your personalized voting roadmap now..."
    }]);

    const hasId = profile.hasVoterId;
    
    // We generate exactly 6 steps. 1-2 are completed if they have ID.
    const steps: JourneyStep[] = [
      { id: '1', title: 'Check Eligibility', description: 'Confirm you meet the criteria to vote in India.', completed: !!hasId },
      { id: '2', title: 'Register to Vote', description: 'Apply for your Voter ID card (Form 6).', completed: !!hasId },
      { id: '3', title: 'Verify Voter List', description: 'Check your name on the electoral roll.', completed: false },
      { id: '4', title: 'Prepare Documents', description: 'Gather accepted ID proofs for voting day.', completed: false },
      { id: '5', title: 'Locate Polling Booth', description: 'Find exactly where you need to go to vote.', completed: false },
      { id: '6', title: 'Cast Your Vote', description: 'Understand the EVM process and cast your ballot.', completed: false },
    ];
    
    setTimeout(() => {
      setJourneySteps(steps);
      setCurrentScreen('journey');
      setIsTyping(false);
    }, 1500); // simulate some delay
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setInput('');
    
    const newHistory = [...chatHistory, { id: Date.now().toString(), role: 'user' as const, text: userText }];
    setChatHistory(newHistory);
    setIsTyping(true);

    if (mode === 'fullscreen' && onboardingStage !== 'done') {
      // We are in onboarding
      let nextStage: 'age' | 'voterId' | 'state' | 'done' = onboardingStage;
      let prompt = '';
      let updatedProfile = { ...userProfile };

      if (onboardingStage === 'age') {
        updatedProfile.age = parseInt(userText) || 18; // simplistic extraction
        nextStage = 'voterId';
        prompt = `The user answered their age: "${userText}". Acknowledge it briefly and warmly. Then ask if they already have a Voter ID card.`;
      } else if (onboardingStage === 'voterId') {
        updatedProfile.hasVoterId = userText.toLowerCase().includes('yes') || userText.toLowerCase().includes('have') || userText.toLowerCase().includes('y');
        nextStage = 'state';
        prompt = `The user answered if they have a Voter ID: "${userText}". Acknowledge it nicely. Then ask which Indian state they live in.`;
      } else if (onboardingStage === 'state') {
        updatedProfile.state = userText;
        updatedProfile.onboardingComplete = true;
        nextStage = 'done';
        prompt = `The user answered their state: "${userText}". Acknowledge it enthusiastically. Say you are preparing their personalized roadmap now.`;
      }

      setUserProfile(updatedProfile);
      setOnboardingStage(nextStage);

      const aiResponse = await sendMessage(prompt, false);
      setChatHistory([...newHistory, { id: Date.now().toString(), role: 'ai', text: aiResponse }]);
      
      if (nextStage === 'done') {
        generateJourney(updatedProfile);
      } else {
        setIsTyping(false);
      }
    } else {
      // Normal Q&A uses RAG
      const aiResponse = await retrieveAndAnswer(userText);
      setChatHistory([...newHistory, { id: Date.now().toString(), role: 'ai', text: aiResponse }]);
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
            <MessageSquare size={20} /> VoteWise AI
          </h2>
          {mode === 'floating' && <p className="text-xs text-blue-200">Ask me anything about voting!</p>}
        </div>
        {mode === 'floating' && (
          <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-300">
            <ChevronDown size={24} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
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
