import { useRef, useCallback } from 'react';
import type { Content } from '@google/generative-ai';
import { retrieveChunks } from '../rag/retriever';
import { useLanguage } from '../context/LanguageContext';
import type { SupportedLanguage } from '../context/LanguageContext';

// NOTE: No API keys are imported here. All keys live server-side in the /api/gemini.ts proxy.
// In development (npm run dev), Vite proxies /api → the serverless function via vercel dev,
// or you can set VITE_PROXY_URL='' to use the local Vercel dev server.

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  mr: 'Marathi',
};

const CHAT_MODEL = 'gemini-2.5-flash';
const RAG_MODEL = 'gemini-2.5-flash';


const SYSTEM_INSTRUCTION = (lang: SupportedLanguage) => `
You are VoteWise, India's friendly election guide.
Rules:
- ALWAYS respond in ${LANGUAGE_NAMES[lang]} only. Do not mix languages.
- If the user writes in any language, still reply in ${LANGUAGE_NAMES[lang]}.
- Be conversational, warm, and encouraging.
- Use short paragraphs, maximum 3 sentences per response.
- For Hindi: use simple, everyday Hindi (not formal Sanskritized Hindi).
- For Tamil: use common spoken Tamil, avoid archaic vocabulary.
- For Marathi: use standard Marathi, accessible to rural and urban voters.
- Guide the Indian citizen through their voting journey.
- DIRECT ANSWER ONLY: Do not output your internal reasoning, constraints, or thought process.
`;

const RAG_INSTRUCTION = (lang: SupportedLanguage) =>
  `You are VoteWise, an Indian election assistant.
   Answer ONLY using the context below.
   ALWAYS respond in ${LANGUAGE_NAMES[lang]}.
   If context is insufficient, say the equivalent of
   "Please check eci.gov.in for more details." in ${LANGUAGE_NAMES[lang]}.
   Keep answers under 3 sentences. Be warm and direct.
   DIRECT ANSWER ONLY: Do not output your internal reasoning, rules, or thought process. Just provide the final answer.`;

function ensureComplete(text: string): string {
  const trimmed = text.trim();
  if (!/[.!?।]$/.test(trimmed)) return trimmed + '...';
  return trimmed;
}

/**
 * In development (npm run dev / Vite), we call the Gemini REST API directly
 * using the VITE_GEMINI_API_KEY env var (visible to the browser, dev-only).
 * In production (Vercel), we call the /api/gemini serverless proxy so the key
 * never leaves the server.
 */
const IS_DEV = import.meta.env.DEV;
const DEV_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

async function callProxy(payload: {
  keyType: 'chat' | 'rag';
  model: string;
  systemInstruction: string;
  history: Content[];
  userMessage: string;
  retrievedContext?: string;
}): Promise<string> {
  const { keyType, model, systemInstruction, history, userMessage, retrievedContext } = payload;

  // ── DEV mode: hit the Gemini REST API directly ──────────────────────────
  if (IS_DEV) {
    if (!DEV_API_KEY) {
      throw new Error('Missing VITE_GEMINI_API_KEY in .env for local development.');
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${DEV_API_KEY}`;
    const body = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [
        ...history,
        {
          role: 'user',
          parts: [{ text: retrievedContext ? `Context:\n${retrievedContext}\n\nQuestion: ${userMessage}` : userMessage }],
        },
      ],
      generationConfig: { maxOutputTokens: 1024, temperature: keyType === 'rag' ? 0.2 : 0.7 },
    };
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
      const errBody = await res.text();
      console.error('[Gemini Dev] API error:', res.status, errBody);
      throw Object.assign(new Error(errBody), { status: res.status });
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  // ── PRODUCTION mode: use the secure serverless proxy ────────────────────
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw Object.assign(new Error(err.error ?? 'Proxy error'), { status: response.status });
  }

  const data = await response.json();
  return data.text ?? '';
}

export function useGemini() {
  const historyRef = useRef<Content[]>([]);
  const { language } = useLanguage();

  const sendMessage = useCallback(async (message: string) => {
    try {
      const historySnapshot = [...historyRef.current];
      const text = await callProxy({
        keyType: 'chat',
        model: CHAT_MODEL,
        systemInstruction: SYSTEM_INSTRUCTION(language),
        history: historySnapshot,
        userMessage: message,
      });

      const responseText = ensureComplete(text);
      historyRef.current.push(
        { role: 'user', parts: [{ text: message }] },
        { role: 'model', parts: [{ text: responseText }] }
      );
      return responseText;
    } catch (error: unknown) {
      const err = error as { status?: number };
      console.warn('Gemini chat proxy error:', err);
      if (err.status === 429) return 'Too many requests — please wait a moment.';
      if (err.status === 503) return 'Servers busy — please try again shortly.';
      return 'Error connecting to AI. Please try again.';
    }
  }, [language]);

  const retrieveAndAnswer = useCallback(async (userQuery: string): Promise<string> => {
    const chunks = retrieveChunks(userQuery, 3);
    if (chunks.length === 0) {
      return "I can only help with Indian voting questions. Try asking about registering, EVMs, or election procedures!";
    }

    const contextText = chunks.map(c => c.content).join('\n\n');

    try {
      const text = await callProxy({
        keyType: 'rag',
        model: RAG_MODEL,
        systemInstruction: RAG_INSTRUCTION(language),
        history: [],
        userMessage: userQuery,
        retrievedContext: contextText,
      });

      // Fact-Checker Agent: Verification pass
      const FACT_CHECK_INSTRUCTION = `You are a strict fact-checker. 
Read the CONTEXT and the ANSWER. 
If the ANSWER contains any factual claims, numbers, or specific rules that are not explicitly supported by the CONTEXT, you must respond with exactly "REJECT".
If all factual claims in the ANSWER are supported by the CONTEXT, respond with exactly "APPROVE".
Output nothing else.`;

      const verification = await callProxy({
        keyType: 'rag',
        model: CHAT_MODEL,
        systemInstruction: FACT_CHECK_INSTRUCTION,
        history: [],
        userMessage: `CONTEXT:\n${contextText}\n\nANSWER:\n${text}`,
      });

      if (verification.trim().toUpperCase() !== 'APPROVE') {
        console.warn('Fact check rejected the answer:', { answer: text, context: contextText });
        return language === 'en'
          ? "I'm not entirely sure based on my current knowledge. Please verify the details on the official Election Commission of India website (eci.gov.in)."
          : "I am not completely sure. Please check eci.gov.in for more details.";
      }

      return ensureComplete(text);
    } catch (error: unknown) {
      const err = error as { status?: number };
      console.warn('Gemini RAG proxy error:', err);
      if (err.status === 429) return 'Too many requests — please wait a moment.';
      if (err.status === 503) return 'Servers busy — please try again shortly.';
      return 'Error connecting to AI. Please try again.';
    }
  }, [language]);

  const clearHistory = useCallback(() => { historyRef.current = []; }, []);

  return { sendMessage, retrieveAndAnswer, clearHistory };
}