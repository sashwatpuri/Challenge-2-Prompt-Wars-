import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Chat from './Chat';
import { LanguageProvider } from '../context/LanguageContext';
import { UserProfile, ChatMessage } from '../App';

describe('Chat Component', () => {
  const mockSendMessage = vi.fn();
  const mockRetrieveAndAnswer = vi.fn();
  const mockSetChatHistory = vi.fn();
  const mockSetUserProfile = vi.fn();
  const mockSetJourneySteps = vi.fn();
  const mockSetCurrentScreen = vi.fn();

  const baseProps = {
    chatHistory: [] as ChatMessage[],
    setChatHistory: mockSetChatHistory,
    userProfile: { onboardingComplete: false } as UserProfile,
    setUserProfile: mockSetUserProfile,
    setJourneySteps: mockSetJourneySteps,
    setCurrentScreen: mockSetCurrentScreen,
    sendMessage: mockSendMessage,
    retrieveAndAnswer: mockRetrieveAndAnswer,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProvider = (props = {}) => {
    return render(
      <LanguageProvider>
        <Chat mode="fullscreen" {...baseProps} {...props} />
      </LanguageProvider>
    );
  };

  it('renders fullscreen mode with initial greeting', () => {
    renderWithProvider();
    expect(mockSetChatHistory).toHaveBeenCalledWith([{
      id: expect.any(String),
      role: 'ai',
      text: expect.any(String)
    }]);
  });

  it('sends message and gets AI response in normal Q&A mode', async () => {
    const chatHistory: ChatMessage[] = [
      { id: '1', role: 'user', text: 'Hello' },
      { id: '2', role: 'ai', text: 'Hi there' }
    ];
    
    mockRetrieveAndAnswer.mockResolvedValue('I am a bot');

    renderWithProvider({ 
      mode: 'floating',
      chatHistory,
      userProfile: { onboardingComplete: true } 
    });

    // In floating mode, it might be closed initially
    fireEvent.click(screen.getByRole('button', { name: /open chat assistant/i }));

    const input = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(input, { target: { value: 'Who are you?' } });
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendButton);

    expect(mockSetChatHistory).toHaveBeenCalled(); // optimistic update
    
    await waitFor(() => {
      expect(mockRetrieveAndAnswer).toHaveBeenCalledWith('Who are you?');
      // Second call after AI responds
      expect(mockSetChatHistory).toHaveBeenCalledTimes(2);
    });
  });

  it('runs onboarding flow correctly', async () => {
    mockSendMessage.mockResolvedValue('Next question');
    
    renderWithProvider();

    const input = screen.getByPlaceholderText(/Type your message/i);
    
    // Step 1: Age
    fireEvent.change(input, { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(mockSetUserProfile).toHaveBeenCalledWith(expect.objectContaining({ age: 25 }));
      expect(mockSendMessage).toHaveBeenCalled();
    });
  });
});
