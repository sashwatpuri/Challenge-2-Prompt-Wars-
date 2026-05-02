import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// API: Gemini Proxy
const rateLimitMap = new Map();
const RATE_LIMIT = 20; // 20 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000;

app.post('/api/gemini', async (req, res) => {
  const ipHeader = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const clientIp = Array.isArray(ipHeader) ? ipHeader[0] : ipHeader;

  const now = Date.now();
  const limitRecord = rateLimitMap.get(clientIp);

  if (limitRecord) {
    if (now - limitRecord.lastReset > RATE_LIMIT_WINDOW) {
      rateLimitMap.set(clientIp, { count: 1, lastReset: now });
    } else if (limitRecord.count >= RATE_LIMIT) {
      console.warn(`[Gemini Proxy] Rate limit exceeded for IP: ${clientIp}`);
      return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
    } else {
      limitRecord.count++;
    }
  } else {
    rateLimitMap.set(clientIp, { count: 1, lastReset: now });
  }

  const { keyType, model, systemInstruction, history, userMessage, retrievedContext } = req.body;

  const apiKey =
    keyType === 'rag'
      ? process.env.GEMINI_API_KEY_RAG
      : process.env.GEMINI_API_KEY_CHAT;

  if (!apiKey) {
    console.error(`[Gemini Proxy] Missing API key for ${keyType}`);
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  const backupKey = process.env.GEMINI_API_KEY_BACKUP;

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

  async function callGemini(key) {
    return fetch(geminiUrl(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequestBody(retrievedContext)),
    });
  }

  try {
    let response = await callGemini(apiKey);

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
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return res.status(200).json({ text });
  } catch (error) {
    console.error('Gemini proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Generate PDF
app.post('/api/generate-pdf', async (req, res) => {
  const { name, dob, address } = req.body;

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText('Form 6 - Application for inclusion of name in the electoral roll', {
      x: 50,
      y: 800,
      size: 16,
      font: boldFont,
    });

    page.drawText('This is a dynamically generated preparation form, not an official submission.', {
      x: 50,
      y: 770,
      size: 12,
      font: font,
      color: rgb(0.8, 0.1, 0.1),
    });

    page.drawText(`Full Name: ${name || '__________________________'}`, { x: 50, y: 720, size: 14, font: font });
    page.drawText(`Date of Birth: ${dob || '__________________________'}`, { x: 50, y: 680, size: 14, font: font });
    page.drawText(`Address:`, { x: 50, y: 640, size: 14, font: font });
    
    page.drawText(`${address || '__________________________'}`, { x: 50, y: 620, size: 12, font: font, maxWidth: 500, lineHeight: 14 });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Form6_Prep.pdf');
    return res.status(200).send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all to serve index.html for React Router (Express 5 syntax)
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
