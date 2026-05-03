/**
 * Chat.tsx — AI Chat Interface
 *
 * Used in two modes:
 *  - "fullscreen" : Main onboarding screen. Collects user profile (age, voter ID,
 *                   state) through a guided conversation, then triggers journey generation.
 *  - "floating"   : A collapsible chat bubble available on all post-onboarding screens
 *                   for ongoing election Q&A.
 *
 * Voice Features (Phase 3):
 *  - Microphone button records audio via the browser's native MediaRecorder API.
 *  - Audio is base64-encoded and sent to POST /api/speech-to-text for transcription.
 *  - Speaker button on AI bubbles calls POST /api/tts to read responses aloud.
 */

import 'regenerator-runtime/runtime';
import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ChevronDown, Mic, MicOff, Volume2 } from 'lucide-react';
import type { ChatMessage, UserProfile, JourneyStep, Screen } from '../App';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useLanguage } from '../context/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type OnboardingStage = 'age' | 'voterId' | 'state' | 'done';

interface ChatProps {
  mode: 'fullscreen' | 'floating';
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setJourneySteps: React.Dispatch<React.SetStateAction<JourneyStep[]>>;
  setCurrentScreen: React.Dispatch<React.SetStateAction<Screen>>;
  sendMessage: (msg: string) => Promise<string>;
  retrieveAndAnswer: (query: string) => Promise<string>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Chat({
  mode,
  chatHistory,
  setChatHistory,
  userProfile,
  setUserProfile,
  setJourneySteps,
  setCurrentScreen,
  sendMessage,
  retrieveAndAnswer,
}: ChatProps) {
  const { t } = useLanguage();

  // Input / UI state
  const [input, setInput]         = useState('');
  const [isTyping, setIsTyping]   = useState(false);
  const [isOpen, setIsOpen]       = useState(false);    // floating mode toggle
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Tracks whether the last input came from voice so we can auto-play the response
  const [usedVoice, setUsedVoice] = useState(false);

  // Voice recording state
  const [listening, setListening]       = useState(false);
  const mediaRecorderRef                = useRef<MediaRecorder | null>(null);
  const audioChunksRef                  = useRef<Blob[]>([]);

  // Scroll anchor
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Onboarding conversation stage — drives the guided profile collection flow
  const [onboardingStage, setOnboardingStage] = useState<OnboardingStage>(
    userProfile.onboardingComplete ? 'done' : 'age'
  );

  // ─── Effects ──────────────────────────────────────────────────────────────

  // Keep offline status in sync with browser connectivity events
  useEffect(() => {
    const handleOnline  = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-scroll to the latest message whenever history or open state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isOpen]);

  // Show the initial greeting when entering fullscreen chat for the first time
  useEffect(() => {
    if (mode === 'fullscreen' && chatHistory.length === 0) {
      setChatHistory([{ id: Date.now().toString(), role: 'ai', text: t('chat.greeting') }]);
    }
  }, [mode, chatHistory, setChatHistory, t]);

  // ─── Voice: Speech-to-Text ────────────────────────────────────────────────

  /** Requests microphone access and starts recording audio chunks. */
  const startListening = async () => {
    try {
      const stream        = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current   = [];

      // Accumulate audio data chunks as they arrive
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // When recording stops, send the audio to our STT proxy
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader    = new FileReader();
        reader.readAsDataURL(audioBlob);

        reader.onloadend = async () => {
          // Extract the raw base64 content (strip "data:audio/webm;base64," prefix)
          const base64Audio = (reader.result as string).split(',')[1];

          try {
            const res  = await fetch('/api/speech-to-text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioContent: base64Audio, languageCode: 'en-IN' }),
            });
            const data = await res.json();
            if (data.text) {
              setInput(data.text);
              setUsedVoice(true);
            }
          } catch (e) {
            console.error('[STT] Transcription error:', e);
          }
        };
      };

      mediaRecorder.start();
      setListening(true);

    } catch (error) {
      console.error('[STT] Microphone access error:', error);
    }
  };

  /** Stops the active recording and releases the microphone stream. */
  const stopListening = () => {
    if (mediaRecorderRef.current && listening) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setListening(false);
    }
  };

  // ─── Voice: Text-to-Speech ────────────────────────────────────────────────

  /**
   * Sends text to the TTS proxy and plays the returned MP3 directly in the browser.
   * Creates a temporary object URL for the audio blob to avoid storing it in state.
   */
  const playAudio = async (text: string) => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, languageCode: 'en-IN' }),
      });

      if (!response.ok) throw new Error('TTS request failed');

      const blob  = await response.blob();
      const url   = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();

    } catch (e) {
      console.error('[TTS] Playback error:', e);
    }
  };

  // ─── Journey Generation ───────────────────────────────────────────────────

  /**
   * Generates a personalised set of journey steps based on the completed user profile.
   * Underage users get an educational roadmap; eligible voters get the full process.
   */
  const generateJourney = (profile: UserProfile) => {
    setIsTyping(true);
    const isUnderage = (profile.age ?? 0) < 18;

    const steps: JourneyStep[] = isUnderage
      ? [
          { id: '1', title: 'Understand Eligibility',  description: 'Learn the criteria required to vote when you turn 18.', completed: false },
          { id: '2', title: 'Learn about Voter ID',    description: 'Understand how to apply for your Voter ID card (Form 6) in the future.', completed: false },
          { id: '3', title: 'Explore the EVM',         description: 'Try the EVM Simulator to see how voting actually works.', completed: false },
          { id: '4', title: 'Future Polling Booths',   description: 'Learn how to locate polling booths when your time comes.', completed: false },
        ]
      : [
          { id: '1', title: 'Check Eligibility',    description: 'Confirm you meet the criteria to vote in India.', completed: !!profile.hasVoterId },
          { id: '2', title: 'Register to Vote',     description: 'Apply for your Voter ID card (Form 6).', completed: !!profile.hasVoterId },
          { id: '3', title: 'Verify Voter List',    description: 'Check your name on the electoral roll.', completed: false },
          { id: '4', title: 'Prepare Documents',    description: 'Gather accepted ID proofs for voting day.', completed: false },
          { id: '5', title: 'Locate Polling Booth', description: 'Find exactly where you need to go to vote.', completed: false },
          { id: '6', title: 'Cast Your Vote',       description: 'Understand the EVM process and cast your ballot.', completed: false },
        ];

    // Simulate a brief processing delay for UX feedback
    setTimeout(() => {
      setJourneySteps(steps);
      setIsTyping(false);
    }, 1500);
  };

  // ─── Message Sending ──────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');
    if (listening) stopListening();

    const newHistory: ChatMessage[] = [
      ...chatHistory,
      { id: Date.now().toString(), role: 'user', text: userText },
    ];
    setChatHistory(newHistory);
    setIsTyping(true);

    // Offline guard — return a cached fallback message
    if (isOffline) {
      setTimeout(() => {
        setChatHistory([...newHistory, {
          id: Date.now().toString(),
          role: 'ai',
          text: t('error.offline') ||
            'You are currently offline. Please refer to your saved journey steps or cached guides. Full AI capabilities will resume when you reconnect.',
        }]);
        setIsTyping(false);
      }, 1000);
      return;
    }

    // ── Onboarding flow ─────────────────────────────────────────────────────
    // Collect age → voter ID status → state, then generate the journey
    if (mode === 'fullscreen' && onboardingStage !== 'done') {
      let nextStage: OnboardingStage = onboardingStage;
      let prompt = '';
      const updatedProfile = { ...userProfile };

      if (onboardingStage === 'age') {
        const extractedAge      = parseInt(userText) || 18;
        updatedProfile.age      = extractedAge;

        if (extractedAge < 18) {
          updatedProfile.onboardingComplete = true;
          nextStage = 'done';
          prompt = `The user answered their age: "${userText}". Warmly explain that they must be 18 to vote in India, but tell them you have prepared an educational roadmap for them to view below.`;
        } else {
          nextStage = 'voterId';
          prompt = `The user answered their age: "${userText}". Acknowledge it briefly and warmly. Then ask if they already have a Voter ID card.`;
        }

      } else if (onboardingStage === 'voterId') {
        updatedProfile.hasVoterId = /yes|have|y/i.test(userText);
        nextStage = 'state';
        prompt = `The user answered if they have a Voter ID: "${userText}". Acknowledge it nicely. Then ask which Indian state they live in.`;

      } else if (onboardingStage === 'state') {
        updatedProfile.state              = userText;
        updatedProfile.onboardingComplete = true;
        nextStage = 'done';
        prompt = `The user answered their state: "${userText}". Acknowledge it enthusiastically. Say you have prepared their personalized roadmap and they can view it by clicking the button below.`;
      }

      setUserProfile(updatedProfile);
      setOnboardingStage(nextStage);

      const aiResponse = await sendMessage(prompt);
      setChatHistory([...newHistory, { id: Date.now().toString(), role: 'ai', text: aiResponse }]);

      // Auto-play the AI response if the user's input came from voice
      if (usedVoice) {
        playAudio(aiResponse);
        setUsedVoice(false);
      }

      if (nextStage === 'done') {
        generateJourney(updatedProfile);
      } else {
        setIsTyping(false);
      }

    // ── Normal Q&A (RAG) ────────────────────────────────────────────────────
    } else {
      const aiResponse = await retrieveAndAnswer(userText);
      setChatHistory([...newHistory, { id: Date.now().toString(), role: 'ai', text: aiResponse }]);

      if (usedVoice) {
        playAudio(aiResponse);
        setUsedVoice(false);
      }
      setIsTyping(false);
    }
  };

  // ─── Floating Mode (Collapsed) ────────────────────────────────────────────

  if (mode === 'floating' && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-[var(--color-saffron)] text-white shadow-lg hover:bg-orange-500 transition-colors z-50 flex items-center justify-center"
        aria-label="Open chat assistant"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  // ─── Container ────────────────────────────────────────────────────────────

  const containerClasses = mode === 'fullscreen'
    ? 'flex flex-col h-[calc(100vh-120px)] w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'
    : 'fixed bottom-6 right-6 w-[350px] h-[500px] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden z-50';

  // ─── Render ───────────────────────────────────────────────────────────────

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
          <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-300" aria-label="Close chat">
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
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm relative group'
              }`}
            >
              {/* TTS speaker button — appears on hover over AI messages */}
              {msg.role === 'ai' && (
                <button
                  onClick={() => playAudio(msg.text)}
                  className="absolute -right-8 top-2 p-1.5 text-gray-400 hover:text-[var(--color-india-blue)] opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-gray-100"
                  title="Listen to message"
                  aria-label="Play message audio"
                >
                  <Volume2 size={16} />
                </button>
              )}

              {/* Render AI messages as sanitised markdown; user messages as plain text */}
              {msg.role === 'ai' ? (
                <div
                  className="prose prose-sm max-w-none break-words"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked.parse(msg.text) as string),
                  }}
                />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-1 bg-white rounded-2xl px-4 py-3 w-fit shadow-sm">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        )}

        {/* CTA to view the Journey roadmap after onboarding completes */}
        {userProfile.onboardingComplete && !isTyping && mode === 'fullscreen' && (
          <div className="flex justify-center mt-6 mb-2">
            <button
              onClick={() => setCurrentScreen('journey')}
              className="px-6 py-2.5 bg-[var(--color-saffron)] text-white font-medium rounded-full hover:bg-orange-600 transition-colors shadow-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {t('viewRoadmap')} &rarr;
            </button>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center">
        {/* Microphone button — only shown if getUserMedia is supported */}
        {navigator.mediaDevices?.getUserMedia && (
          <button
            onClick={() => {
              if (listening) {
                stopListening();
              } else {
                setUsedVoice(true);
                setInput('');
                startListening();
              }
            }}
            className={`p-2 rounded-full transition-colors ${
              listening
                ? 'bg-red-500 text-white animate-pulse shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={listening ? 'Stop listening' : 'Start voice input'}
            aria-label={listening ? 'Stop listening' : 'Start voice input'}
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
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
