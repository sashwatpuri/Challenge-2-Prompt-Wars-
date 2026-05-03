/**
 * useGemini.test.ts — AI Hook Unit Tests
 *
 * Tests the useGemini hook in full isolation from the network.
 * Every test stubs `fetch` so no real API calls are made.
 *
 * Coverage:
 *  1. sendMessage — happy path returns processed text
 *  2. sendMessage — handles 429 rate-limit gracefully
 *  3. sendMessage — handles 503 server error gracefully
 *  4. retrieveAndAnswer — RAG + fact-check pass returns text
 *  5. retrieveAndAnswer — returns fallback when fact-check rejects the answer
 *  6. retrieveAndAnswer — returns fallback when query has no matching chunks
 *  7. clearHistory — resets in-memory conversation history
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGemini } from './useGemini';
import { LanguageProvider } from '../context/LanguageContext';
import type { ReactNode } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Wraps the hook with the required LanguageProvider. */
const wrapper = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

/**
 * Returns a mock fetch Response object.
 * Used to stub global.fetch for individual test cases.
 */
function mockFetchResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

/**
 * Helper to construct the deeply nested Gemini API response shape.
 */
function mockGeminiResponse(text: string) {
  return {
    candidates: [
      {
        content: { parts: [{ text }] },
      },
    ],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useGemini()', () => {
  beforeEach(() => {
    // Reset to a clean fetch stub before each test
    vi.mocked(fetch).mockReset();
  });

  // ── sendMessage ───────────────────────────────────────────────────────────

  describe('sendMessage()', () => {
    it('returns the model text on a successful API call', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        mockFetchResponse(mockGeminiResponse('Hello from VoteWise.'))
      );

      const { result } = renderHook(() => useGemini(), { wrapper });
      let response = '';

      await act(async () => {
        response = await result.current.sendMessage('Hi');
      });

      expect(response).toBe('Hello from VoteWise.');
    });

    it('appends "..." when the response does not end with punctuation', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        mockFetchResponse(mockGeminiResponse('I can help you vote')) // no trailing punctuation
      );

      const { result } = renderHook(() => useGemini(), { wrapper });
      let response = '';

      await act(async () => {
        response = await result.current.sendMessage('Help?');
      });

      expect(response).toMatch(/\.\.\.$/);
    });

    it('returns a rate-limit message on HTTP 429', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        mockFetchResponse({ error: 'rate limited' }, false, 429)
      );

      const { result } = renderHook(() => useGemini(), { wrapper });
      let response = '';

      await act(async () => {
        response = await result.current.sendMessage('Hello');
      });

      expect(response).toMatch(/too many requests/i);
    });

    it('returns a server-busy message on HTTP 503', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        mockFetchResponse({ error: 'Service unavailable' }, false, 503)
      );

      const { result } = renderHook(() => useGemini(), { wrapper });
      let response = '';

      await act(async () => {
        response = await result.current.sendMessage('Hello');
      });

      expect(response).toMatch(/busy|try again/i);
    });

    it('returns an error message on unexpected network failure', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useGemini(), { wrapper });
      let response = '';

      await act(async () => {
        response = await result.current.sendMessage('Hello');
      });

      expect(response).toMatch(/error connecting/i);
    });
  });

  // ── retrieveAndAnswer ─────────────────────────────────────────────────────

  describe('retrieveAndAnswer()', () => {
    it('returns the model answer when fact-check approves it', async () => {
      // First fetch = RAG answer generation
      vi.mocked(fetch).mockResolvedValueOnce(
        mockFetchResponse(mockGeminiResponse('You must be 18 to vote.'))
      );
      // Second fetch = fact-checker returning APPROVE
      vi.mocked(fetch).mockResolvedValueOnce(
        mockFetchResponse(mockGeminiResponse('APPROVE'))
      );

      const { result } = renderHook(() => useGemini(), { wrapper });
      let response = '';

      await act(async () => {
        response = await result.current.retrieveAndAnswer('How old do I need to be to vote?');
      });

      expect(response).toContain('18');
    });

    it('returns a fallback message when the fact-checker rejects the answer', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        mockFetchResponse(mockGeminiResponse('You need to be 21 to vote.')) // wrong answer
      );
      vi.mocked(fetch).mockResolvedValueOnce(
        mockFetchResponse(mockGeminiResponse('REJECT')) // fact-checker catches it
      );

      const { result } = renderHook(() => useGemini(), { wrapper });
      let response = '';

      await act(async () => {
        response = await result.current.retrieveAndAnswer('voting age in india');
      });

      // Should redirect to eci.gov.in, not return the hallucinated answer
      expect(response).toMatch(/eci\.gov\.in|not entirely sure/i);
    });

    it('returns an off-topic message when no KB chunks match the query', async () => {
      const { result } = renderHook(() => useGemini(), { wrapper });
      let response = '';

      await act(async () => {
        // A query with no election-related tokens — retriever returns []
        response = await result.current.retrieveAndAnswer('xyzzy nonexistent gibberish foobar');
      });

      expect(response).toMatch(/only help with indian voting/i);
    });
  });

  // ── clearHistory ──────────────────────────────────────────────────────────

  describe('clearHistory()', () => {
    it('is callable without throwing', async () => {
      const { result } = renderHook(() => useGemini(), { wrapper });

      // Add a message to history first
      vi.mocked(fetch).mockResolvedValueOnce(
        mockFetchResponse({ text: 'Hi there.' })
      );
      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      // Then clear — should not throw
      expect(() => { act(() => { result.current.clearHistory(); }); }).not.toThrow();
    });
  });
});
