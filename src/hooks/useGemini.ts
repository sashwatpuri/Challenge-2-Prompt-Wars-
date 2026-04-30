import { useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Content } from '@google/generative-ai';
import { retrieveChunks } from '../rag/retriever';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_INSTRUCTION = `You are VoteWise, India's friendly election guide.
Rules:
- Be conversational, warm, and encouraging.
- Always address the user directly.
- Use short paragraphs, maximum 3 sentences per response.
- Guide the Indian citizen through their voting journey.
`;

function ensureComplete(text: string): string {
  const trimmed = text.trim();
  if (!/[.!?।]$/.test(trimmed)) return trimmed + '...';
  return trimmed;
}

export function useGemini() {
  const historyRef = useRef<Content[]>([]);

  const sendMessage = useCallback(async (message: string, isJourneyGeneration = false) => {
    if (!apiKey) return 'API Key is missing. Please configure VITE_GEMINI_API_KEY.';

    const fallbackModels = ['gemini-3.1-flash-live-preview', 'gemini-2.5-flash'];
    let lastError: any = null;

    for (const modelName of fallbackModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION,
        });

        const userContent: Content = { role: 'user', parts: [{ text: message }] };

        // Snapshot history BEFORE this turn
        const historySnapshot = [...historyRef.current];

        const chat = model.startChat({
          history: historySnapshot,
          generationConfig: {
            maxOutputTokens: isJourneyGeneration ? 600 : 400,
          },
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        // Push both turns AFTER success
        historyRef.current.push(userContent, {
          role: 'model',
          parts: [{ text: responseText }],
        });

        return ensureComplete(responseText);
      } catch (error: any) {
        console.warn(`Gemini API error with model ${modelName}:`, error);
        lastError = error;
      }
    }

    if (lastError?.message?.includes('429')) return 'Too many requests — please wait a moment.';
    if (lastError?.message?.includes('503')) return 'Servers busy — please try again shortly.';
    return 'Error connecting to AI. Please try again.';
  }, []);

  const retrieveAndAnswer = useCallback(async (userQuery: string): Promise<string> => {
    if (!apiKey) return 'API Key is missing.';

    const chunks = retrieveChunks(userQuery, 3);
    if (chunks.length === 0) {
      return "I can only help with Indian voting questions. Try asking about registering, EVMs, or election procedures!";
    }

    const fallbackModels = ['gemini-3.1-flash-live-preview', 'gemini-2.5-flash'];
    let lastError: any = null;

    for (const modelName of fallbackModels) {
      try {
        const ragInstruction = `You are VoteWise, an Indian election assistant. Answer ONLY using the context below. If context is insufficient, say: "Please check eci.gov.in for more details." Keep answers under 3 sentences. Be warm and direct.`;

        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: ragInstruction,
        });

        const contextText = chunks.map(c => c.content).join('\n\n');
        const prompt = `Context:\n${contextText}\n\nQuestion: ${userQuery}`;

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 350 },
        });

        return ensureComplete(result.response.text());
      } catch (error: any) {
        console.warn(`Gemini RAG error with model ${modelName}:`, error);
        lastError = error;
      }
    }

    if (lastError?.message?.includes('429')) return 'Too many requests — please wait a moment.';
    if (lastError?.message?.includes('503')) return 'Servers busy — please try again shortly.';
    return 'Error connecting to AI. Please try again.';
  }, []);

  const clearHistory = useCallback(() => { historyRef.current = []; }, []);

  return { sendMessage, retrieveAndAnswer, clearHistory };
}