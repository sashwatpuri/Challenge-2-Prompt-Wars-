/**
 * server.js — VoteWise Express Backend
 *
 * Serves as:
 *  1. A secure proxy for the Gemini API (keeps API keys server-side)
 *  2. A voice proxy for Google Cloud TTS and STT APIs
 *  3. A PDF generation endpoint for Form 6 preparation
 *  4. A mock Booth Locator endpoint
 *  5. Static file host for the built React frontend (production)
 *
 * Environment Variables Required (.env):
 *  - GEMINI_API_KEY_CHAT       : Primary Gemini key for chat
 *  - GEMINI_API_KEY_RAG        : Primary Gemini key for RAG queries
 *  - GEMINI_API_KEY_BACKUP     : Fallback key when rate limits are hit
 *  - GOOGLE_APPLICATION_CREDENTIALS : Absolute path to GCP service account JSON
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import textToSpeech from '@google-cloud/text-to-speech';
import speech from '@google-cloud/speech';

// Load .env variables into process.env
dotenv.config();

// Resolve __dirname in ES Module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(cors());
// Limit increased to 50mb to support base64-encoded audio payloads for STT
app.use(express.json({ limit: '50mb' }));

// ─── Rate Limiting (In-Memory) ───────────────────────────────────────────────

const rateLimitMap = new Map();
const RATE_LIMIT = 20;               // max requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms

/**
 * Checks and updates the rate limit for a given IP address.
 * Returns true if the request is allowed, false if rate-limited.
 */
function checkRateLimit(clientIp) {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);

  if (!record) {
    rateLimitMap.set(clientIp, { count: 1, lastReset: now });
    return true;
  }

  if (now - record.lastReset > RATE_LIMIT_WINDOW) {
    // Window expired — reset counter
    rateLimitMap.set(clientIp, { count: 1, lastReset: now });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false; // Rate limited
  }

  record.count++;
  return true;
}

// ─── API: Gemini Proxy ───────────────────────────────────────────────────────

/**
 * POST /api/gemini
 * Proxies requests to the Gemini REST API.
 * Keeps API keys server-side and applies per-IP rate limiting.
 *
 * Body: { keyType, model, systemInstruction, history, userMessage, retrievedContext? }
 */
app.post('/api/gemini', async (req, res) => {
  // Resolve client IP from proxy headers or socket
  const ipHeader = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const clientIp = Array.isArray(ipHeader) ? ipHeader[0] : ipHeader;

  if (!checkRateLimit(clientIp)) {
    console.warn(`[Gemini Proxy] Rate limit exceeded for IP: ${clientIp}`);
    return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
  }

  const { keyType, model, systemInstruction, history, userMessage, retrievedContext } = req.body;

  // Select the appropriate API key based on request type
  const apiKey = keyType === 'rag'
    ? process.env.GEMINI_API_KEY_RAG
    : process.env.GEMINI_API_KEY_CHAT;

  if (!apiKey) {
    console.error(`[Gemini Proxy] Missing API key for keyType="${keyType}"`);
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  const backupKey = process.env.GEMINI_API_KEY_BACKUP;

  // Build the request body for the Gemini generateContent endpoint
  const buildRequestBody = (context) => ({
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [
      ...(history || []),
      {
        role: 'user',
        parts: [{ text: context ? `Context:\n${context}\n\nQuestion: ${userMessage}` : userMessage }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: keyType === 'rag' ? 0.2 : 0.7,
    },
  });

  const geminiUrl = (key) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const callGemini = (key) =>
    fetch(geminiUrl(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequestBody(retrievedContext)),
    });

  try {
    let response = await callGemini(apiKey);

    // Fallback to backup key if the primary hits a rate limit
    if (response.status === 429 && backupKey) {
      console.warn(`[Gemini Proxy] Rate limit on ${keyType} key. Falling back to backup key.`);
      response = await callGemini(backupKey);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Gemini Proxy] Google API error (${response.status}):`, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return res.status(200).json({ text });

  } catch (error) {
    console.error('[Gemini Proxy] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── API: PDF Generation ─────────────────────────────────────────────────────

/**
 * POST /api/generate-pdf
 * Generates a Form 6 preparation PDF from the provided user data.
 * This is NOT an official submission — it is a preparation helper only.
 *
 * Body: { name, dob, address }
 */
app.post('/api/generate-pdf', async (req, res) => {
  const { name, dob, address } = req.body;

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Title
    page.drawText('Form 6 - Application for inclusion of name in the electoral roll', {
      x: 50, y: 800, size: 16, font: boldFont,
    });

    // Disclaimer in red
    page.drawText('This is a dynamically generated preparation form, not an official submission.', {
      x: 50, y: 770, size: 12, font, color: rgb(0.8, 0.1, 0.1),
    });

    // User fields
    page.drawText(`Full Name: ${name || '__________________________'}`, { x: 50, y: 720, size: 14, font });
    page.drawText(`Date of Birth: ${dob || '__________________________'}`, { x: 50, y: 680, size: 14, font });
    page.drawText(`Address:`, { x: 50, y: 640, size: 14, font });
    page.drawText(`${address || '__________________________'}`, {
      x: 50, y: 620, size: 12, font, maxWidth: 500, lineHeight: 14,
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Form6_Prep.pdf');
    return res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('[PDF] Error generating PDF:', error);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// ─── API: Booth Locator (Mock) ───────────────────────────────────────────────

/**
 * POST /api/booth-locator
 * Returns mock polling booth locations near New Delhi.
 * In a real deployment, this would call the ECI API or Google Places.
 *
 * Body: { address }
 */
app.post('/api/booth-locator', async (req, res) => {
  // Mock center coordinates for New Delhi
  const lat = 28.6139;
  const lng = 77.2090;

  return res.status(200).json({
    booths: [
      {
        id: 1,
        name: 'Govt Boys Senior Secondary School',
        lat: lat + (Math.random() - 0.5) * 0.02,
        lng: lng + (Math.random() - 0.5) * 0.02,
        address: 'New Delhi, Delhi',
        distance: '1.2 km',
      },
      {
        id: 2,
        name: 'Primary Health Center',
        lat: lat + (Math.random() - 0.5) * 0.02,
        lng: lng + (Math.random() - 0.5) * 0.02,
        address: 'New Delhi, Delhi',
        distance: '2.5 km',
      },
    ],
  });
});

// ─── API: Text-to-Speech ─────────────────────────────────────────────────────

/**
 * POST /api/tts
 * Converts text to an MP3 audio buffer using Google Cloud Text-to-Speech.
 * Authentication uses the GOOGLE_APPLICATION_CREDENTIALS service account.
 *
 * Body: { text, languageCode? }  (default languageCode: 'en-IN')
 */
app.post('/api/tts', async (req, res) => {
  const { text, languageCode } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const client = new textToSpeech.TextToSpeechClient();

    // Select voice based on language (falls back to English Indian Neural voice)
    const voiceName = languageCode === 'hi-IN' ? 'hi-IN-Neural2-A' : 'en-IN-Neural2-A';

    const request = {
      input: { text },
      voice: { languageCode: languageCode || 'en-IN', name: voiceName },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await client.synthesizeSpeech(request);

    res.setHeader('Content-Type', 'audio/mp3');
    res.send(Buffer.from(response.audioContent, 'binary'));

  } catch (error) {
    console.error('[TTS] Error generating speech:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// ─── API: Speech-to-Text ─────────────────────────────────────────────────────

/**
 * POST /api/speech-to-text
 * Transcribes base64-encoded audio using Google Cloud Speech-to-Text.
 * Expects WebM/Opus format from the browser's MediaRecorder API.
 *
 * Body: { audioContent (base64 string), languageCode? }
 */
app.post('/api/speech-to-text', async (req, res) => {
  const { audioContent, languageCode } = req.body;

  if (!audioContent) {
    return res.status(400).json({ error: 'Audio content is required' });
  }

  try {
    const client = new speech.SpeechClient();

    const request = {
      audio: { content: audioContent },
      config: {
        // Browsers record in WebM with Opus codec by default
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: languageCode || 'en-IN',
      },
    };

    const [response] = await client.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    res.json({ text: transcription });

  } catch (error) {
    console.error('[STT] Error transcribing speech:', error);
    res.status(500).json({ error: 'Failed to transcribe speech' });
  }
});

// ─── Static Frontend (Production) ────────────────────────────────────────────

// Serve the Vite build output as static files
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all: send index.html for all non-API routes (supports React Router)
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Running on port ${PORT}`);
});
