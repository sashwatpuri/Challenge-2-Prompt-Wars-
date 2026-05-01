import type { VercelRequest, VercelResponse } from '@vercel/node';

// This serverless function acts as a secure proxy for the Gemini API.
// Keys are kept entirely server-side; the browser never sees them.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { keyType, model, systemInstruction, history, userMessage, retrievedContext } = req.body as {
    keyType: 'chat' | 'rag';
    model: string;
    systemInstruction: string;
    history: Array<{ role: string; parts: Array<{ text: string }> }>;
    userMessage: string;
    retrievedContext?: string;
  };

  // Select the appropriate API key server-side based on task type
  const apiKey =
    keyType === 'rag'
      ? process.env.GEMINI_API_KEY_RAG
      : process.env.GEMINI_API_KEY_CHAT;

  if (!apiKey) {
    console.error(`[Gemini Proxy] Missing API key for ${keyType}`);
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  const backupKey = process.env.GEMINI_API_KEY_BACKUP;

  const buildRequestBody = (context?: string) => ({
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [
      ...history,
      {
        role: 'user',
        parts: [{ text: context ? `Context:\n${context}\n\nQuestion: ${userMessage}` : userMessage }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: keyType === 'rag' ? 0.2 : 0.7,
    },
  });

  const geminiUrl = (key: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  async function callGemini(key: string): Promise<Response> {
    return fetch(geminiUrl(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequestBody(retrievedContext)),
    });
  }

  let response = await callGemini(apiKey);

  // Automatic fallback to backup key on rate-limit (HTTP 429)
  if (response.status === 429 && backupKey) {
    console.warn(`[Gemini Proxy] Rate limit hit on ${keyType} key. Falling back to backup key.`);
    response = await callGemini(backupKey);
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Gemini Proxy] Google API error (${response.status}):`, errorText);
    return res.status(response.status).json({ error: errorText });
  }

  const data = await response.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  return res.status(200).json({ text });
}
