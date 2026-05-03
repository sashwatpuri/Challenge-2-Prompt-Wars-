/**
 * useGemini.ts — AI Hook
 *
 * Provides two methods for interacting with the Gemini model:
 *  - sendMessage       : General conversational chat (used during onboarding)
 *  - retrieveAndAnswer : RAG-backed Q&A with a built-in fact-checker agent
 *
 * ─── Routing Strategy ────────────────────────────────────────────────────────
 * DEV  (npm run dev): Calls the Gemini REST API directly using VITE_GEMINI_API_KEY.
 *                     Avoids needing the Express backend for UI development.
 * PROD (node server): Calls /api/gemini (our Express proxy) so API keys stay
 *                     completely server-side and never reach the browser.
 */

import { useRef, useCallback } from 'react';
import type { Content } from '@google/generative-ai';
import { retrieveChunks } from '../rag/retriever';
import { useLanguage } from '../context/LanguageContext';
import type { SupportedLanguage } from '../context/LanguageContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHAT_MODEL = 'gemini-2.5-flash';
const RAG_MODEL  = 'gemini-2.5-flash';

// Full display names used in system prompts to instruct the model's reply language
const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  mr: 'Marathi',
};

// ─── System Prompts ───────────────────────────────────────────────────────────

/** Conversational chat persona for general onboarding & Q&A. */
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

/** Stricter RAG persona — answers only from retrieved context. */
const RAG_INSTRUCTION = (lang: SupportedLanguage) =>
  `You are VoteWise, an Indian election assistant.
   Answer ONLY using the context below.
   ALWAYS respond in ${LANGUAGE_NAMES[lang]}.
   If context is insufficient, say the equivalent of
   "Please check eci.gov.in for more details." in ${LANGUAGE_NAMES[lang]}.
   Keep answers under 3 sentences. Be warm and direct.
   DIRECT ANSWER ONLY: Do not output your internal reasoning, rules, or thought process.`;

/** One-shot fact-checker — outputs only "APPROVE" or "REJECT". */
const FACT_CHECK_INSTRUCTION =
  `You are a strict fact-checker.
   Read the CONTEXT and the ANSWER.
   If the ANSWER contains any factual claims, numbers, or specific rules not explicitly
   supported by the CONTEXT, respond with exactly "REJECT".
   If all factual claims are supported by the CONTEXT, respond with exactly "APPROVE".
   Output nothing else.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Ensures the AI response ends with a proper sentence terminator.
 * Appends "..." if the text ends mid-sentence to prevent abrupt cut-offs.
 */
function ensureComplete(text: string): string {
  const trimmed = text.trim();
  return /[.!?।]$/.test(trimmed) ? trimmed : trimmed + '...';
}

// ─── DEV vs PROD Routing ──────────────────────────────────────────────────────
// NOTE: These are read lazily inside callProxy (not at module load time) so that
// Vitest's vi.stubEnv() stubs are applied before the values are consumed.

// Payload shape accepted by both the direct Gemini API and our proxy
interface ProxyPayload {
  keyType: 'chat' | 'rag';
  model: string;
  systemInstruction: string;
  history: Content[];
  userMessage: string;
  retrievedContext?: string;
}

/**
 * Calls the Gemini model, routing to:
 *  - The direct Gemini REST API in development (using VITE_GEMINI_API_KEY)
 *  - The /api/gemini Express proxy in production (key stays server-side)
 */
async function callProxy(payload: ProxyPayload): Promise<string> {
  const { keyType, model, systemInstruction, history, userMessage, retrievedContext } = payload;

  // Read env flags lazily at call time so vi.stubEnv() in tests takes effect
  const IS_DEV      = String(import.meta.env.DEV) === 'true';
  const DEV_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  // ── DEV mode: hit the Gemini REST API directly ─────────────────────────────
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
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: keyType === 'rag' ? 0.2 : 0.7,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[Gemini Dev] API error:', res.status, errBody);
      throw Object.assign(new Error(errBody), { status: res.status });
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  // ── PROD mode: call the secure Express proxy ───────────────────────────────
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGemini() {
  // Conversation history persisted in a ref to avoid re-renders on updates
  const historyRef = useRef<Content[]>([]);
  const { language } = useLanguage();

  /**
   * Sends a conversational message and appends both the user message and
   * the model reply to the shared history ref for multi-turn context.
   */
  const sendMessage = useCallback(async (message: string): Promise<string> => {
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

      // Append both turns to history for future context
      historyRef.current.push(
        { role: 'user',  parts: [{ text: message }] },
        { role: 'model', parts: [{ text: responseText }] },
      );

      return responseText;

    } catch (error: unknown) {
      const err = error as { status?: number };
      console.warn('[sendMessage] Error:', err);
      if (err.status === 429) return 'Too many requests — please wait a moment.';
      if (err.status === 503) return 'Servers busy — please try again shortly.';
      return 'Error connecting to AI. Please try again.';
    }
  }, [language]);

  /**
   * Retrieves relevant knowledge-base chunks, sends them to the model as context,
   * then runs a second "fact-checker" pass to validate the answer before returning it.
   * Falls back to an ECI redirect message if the answer fails fact-checking.
   */
  const retrieveAndAnswer = useCallback(async (userQuery: string): Promise<string> => {
    const chunks = retrieveChunks(userQuery, 3);

    if (chunks.length === 0) {
      return 'I can only help with Indian voting questions. Try asking about registering, EVMs, or election procedures!';
    }

    const contextText = chunks.map(c => c.content).join('\n\n');

    try {
      // Step 1: Generate answer from retrieved context
      const answer = await callProxy({
        keyType: 'rag',
        model: RAG_MODEL,
        systemInstruction: RAG_INSTRUCTION(language),
        history: [],
        userMessage: userQuery,
        retrievedContext: contextText,
      });

      // Step 2: Fact-checker agent — validates the answer against the context
      const verification = await callProxy({
        keyType: 'rag',
        model: CHAT_MODEL,
        systemInstruction: FACT_CHECK_INSTRUCTION,
        history: [],
        userMessage: `CONTEXT:\n${contextText}\n\nANSWER:\n${answer}`,
      });

      if (verification.trim().toUpperCase() !== 'APPROVE') {
        console.warn('[RAG] Fact-check rejected answer:', { answer, context: contextText });
        return language === 'en'
          ? "I'm not entirely sure based on my current knowledge. Please verify on eci.gov.in."
          : 'I am not completely sure. Please check eci.gov.in for more details.';
      }

      return ensureComplete(answer);

    } catch (error: unknown) {
      const err = error as { status?: number };
      console.warn('[retrieveAndAnswer] Error:', err);
      if (err.status === 429) return 'Too many requests — please wait a moment.';
      if (err.status === 503) return 'Servers busy — please try again shortly.';
      return 'Error connecting to AI. Please try again.';
    }
  }, [language]);

  /** Clears the conversation history (e.g. on language change or session reset). */
  const clearHistory = useCallback(() => { historyRef.current = []; }, []);

  return { sendMessage, retrieveAndAnswer, clearHistory };
}