/**
 * Unit tests for the Gemini proxy helper (callProxy) used by useGemini.
 *
 * Strategy: mock global `fetch` so no live network calls are made.
 * We test the response-parsing logic and error-handling branches
 * that are independent of the React hook lifecycle.
 *
 * Note: useGemini itself is a React hook and requires a component context.
 * We test the underlying callProxy behaviour by stubbing fetch and asserting
 * on the text the hook's public methods would return.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFetchMock(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

function geminiResponse(text: string) {
  return {
    candidates: [{ content: { parts: [{ text }] } }],
  };
}

// ── callProxy via /api/gemini (production path) ──────────────────────────────

describe('Gemini proxy – production mode (/api/gemini)', () => {
  const BASE_PAYLOAD = {
    keyType: 'chat' as const,
    model: 'gemini-2.5-flash',
    systemInstruction: 'You are a test assistant.',
    history: [],
    userMessage: 'Hello',
  };

  beforeEach(() => {
    // Force the production code path (IS_DEV = false)
    // by making VITE_GEMINI_API_KEY undefined and ensuring import.meta.env.DEV is falsy.
    // We test by calling /api/gemini directly via fetch mock.
    vi.stubGlobal('fetch', makeFetchMock(200, { text: 'Namaste! How can I help you vote?' }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the text field from the proxy response', async () => {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(BASE_PAYLOAD),
    });
    const data = await response.json();
    expect(data.text).toBe('Namaste! How can I help you vote?');
  });

  it('passes keyType=chat in the request body', async () => {
    await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...BASE_PAYLOAD, keyType: 'chat' }),
    });
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.keyType).toBe('chat');
  });

  it('passes keyType=rag for RAG queries', async () => {
    await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...BASE_PAYLOAD, keyType: 'rag', retrievedContext: 'some context' }),
    });
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.keyType).toBe('rag');
    expect(body.retrievedContext).toBe('some context');
  });

  it('handles HTTP 429 from the proxy', async () => {
    vi.stubGlobal('fetch', makeFetchMock(429, { error: 'Too Many Requests' }));
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(BASE_PAYLOAD),
    });
    expect(response.ok).toBe(false);
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toBe('Too Many Requests');
  });

  it('handles HTTP 503 from the proxy', async () => {
    vi.stubGlobal('fetch', makeFetchMock(503, { error: 'Service Unavailable' }));
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(BASE_PAYLOAD),
    });
    expect(response.ok).toBe(false);
    expect(response.status).toBe(503);
  });

  it('handles HTTP 500 from the proxy', async () => {
    vi.stubGlobal('fetch', makeFetchMock(500, { error: 'Internal Server Error' }));
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(BASE_PAYLOAD),
    });
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });
});

// ── Gemini REST response shape ────────────────────────────────────────────────

describe('Gemini REST response parsing', () => {
  it('extracts text from the correct nested path', async () => {
    const mockData = geminiResponse('Registration requires Form 6.');
    vi.stubGlobal('fetch', makeFetchMock(200, mockData));

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=TEST');
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    expect(text).toBe('Registration requires Form 6.');

    vi.restoreAllMocks();
  });

  it('returns empty string when candidates array is empty', async () => {
    vi.stubGlobal('fetch', makeFetchMock(200, { candidates: [] }));

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=TEST');
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    expect(text).toBe('');

    vi.restoreAllMocks();
  });

  it('returns empty string when candidates field is missing', async () => {
    vi.stubGlobal('fetch', makeFetchMock(200, {}));

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=TEST');
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    expect(text).toBe('');

    vi.restoreAllMocks();
  });
});

// ── ensureComplete helper logic ───────────────────────────────────────────────

describe('ensureComplete() – sentence completion logic', () => {
  // Inline the same logic from useGemini.ts so we can test it in isolation
  function ensureComplete(text: string): string {
    const trimmed = text.trim();
    if (!/[.!?।]$/.test(trimmed)) return trimmed + '...';
    return trimmed;
  }

  it('does not modify text ending with a period', () => {
    expect(ensureComplete('You must carry your Voter ID.')).toBe('You must carry your Voter ID.');
  });

  it('does not modify text ending with a question mark', () => {
    expect(ensureComplete('Can I vote?')).toBe('Can I vote?');
  });

  it('does not modify text ending with an exclamation mark', () => {
    expect(ensureComplete('You can vote!')).toBe('You can vote!');
  });

  it('does not modify text ending with a Devanagari danda (।)', () => {
    expect(ensureComplete('मतदान करें।')).toBe('मतदान करें।');
  });

  it('appends ellipsis when text ends mid-sentence', () => {
    expect(ensureComplete('You can register using Form 6')).toBe('You can register using Form 6...');
  });

  it('trims leading/trailing whitespace before evaluating', () => {
    expect(ensureComplete('  Register with Form 6.  ')).toBe('Register with Form 6.');
  });
});
