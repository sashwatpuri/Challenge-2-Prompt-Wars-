import { useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Content } from '@google/generative-ai';
import { retrieveChunks } from '../rag/retriever';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_INSTRUCTION = `You are VoteWise, India's friendly election guide.
Rules:
- Be conversational, warm, and encouraging.
- Always address the user directly ("You're eligible!", "Great — let's get you registered").
- Never dump a wall of text. Use short paragraphs, maximum 3 sentences per response.
- If the user seems confused (e.g., short replies, "I don't know"), proactively simplify and offer multiple choice options.
- Guide the Indian citizen through their voting journey from eligibility check to casting a vote.
`;

function ensureComplete(text: string): string {
  const trimmed = text.trim();
  // If text doesn't end with sentence-ending punctuation, 
  // it was likely cut off — append ellipsis so it's not jarring
  if (!/[.!?।]$/.test(trimmed)) {
    return trimmed + "...";
  }
  return trimmed;
}

export function useGemini() {
  const historyRef = useRef<Content[]>([]);

  const sendMessage = useCallback(async (message: string, isJourneyGeneration = false) => {
    if (!apiKey) {
      console.warn('VITE_GEMINI_API_KEY is not set');
      return 'API Key is missing. Please configure VITE_GEMINI_API_KEY.';
    }

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-3-flash-preview',
        systemInstruction: SYSTEM_INSTRUCTION,
      });

      // Format current user message
      const userContent: Content = {
        role: 'user',
        parts: [{ text: message }],
      };

      // Add to history ref
      historyRef.current.push(userContent);

      const maxOutputTokens = isJourneyGeneration ? 600 : 150;

      const chat = model.startChat({
        history: historyRef.current.slice(0, -1), // Everything except the latest message
        generationConfig: {
          maxOutputTokens,
        },
      });

      const result = await chat.sendMessage(message);
      const responseText = result.response.text();

      // Store model response
      historyRef.current.push({
        role: 'model',
        parts: [{ text: responseText }],
      });

      return ensureComplete(responseText);
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      if (error?.message?.includes('429') || error?.message?.includes('Quota exceeded')) {
        return 'I am receiving too many requests right now. Please wait a few seconds and try again.';
      }
      if (error?.message?.includes('503')) {
        return 'The servers are currently experiencing high demand. Please try again in a moment!';
      }
      return 'I encountered an error connecting to the AI. Please try again.';
    }
  }, []);

  const retrieveAndAnswer = useCallback(async (userQuery: string): Promise<string> => {
    if (!apiKey) {
      console.warn('VITE_GEMINI_API_KEY is not set');
      return 'API Key is missing. Please configure VITE_GEMINI_API_KEY.';
    }

    const chunks = retrieveChunks(userQuery, 3);
    
    if (chunks.length === 0) {
      return "I'm VoteWise, your election guide. I can only help with questions about the Indian voting process. Could you ask me something about registering to vote, EVMs, or election procedures?";
    }

    try {
      const ragSystemInstruction = `You are VoteWise, an election assistant for Indian voters. Answer ONLY using the context provided below. Do not use any outside knowledge. If the context does not contain enough information to answer confidently, say: 'I don't have enough information on that — please check the Election Commission website at eci.gov.in'. Keep answers under 3 sentences. Be warm and direct.`;

      const model = genAI.getGenerativeModel({
        model: 'gemini-3-flash-preview',
        systemInstruction: ragSystemInstruction,
      });

      const contextText = chunks.map(c => c.content).join('\n\n');
      const prompt = `Context:\n${contextText}\n\nUser question: ${userQuery}`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 250,
        }
      });

      return ensureComplete(result.response.text());
    } catch (error: any) {
      console.error('Error calling Gemini API for RAG:', error);
      if (error?.message?.includes('429') || error?.message?.includes('Quota exceeded')) {
        return 'I am receiving too many requests right now. Please wait a few seconds and try again.';
      }
      if (error?.message?.includes('503')) {
        return 'The servers are currently experiencing high demand. Please try again in a moment!';
      }
      return 'I encountered an error connecting to the AI. Please try again.';
    }
  }, []);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
  }, []);

  return { sendMessage, retrieveAndAnswer, clearHistory };
}
