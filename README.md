# 🗳️ VoteWise — India's AI-Powered Voting Guide

> **Challenge 2 — Prompt Wars** | Civic Technology Vertical

VoteWise is an intelligent, multilingual civic assistant that demystifies the Indian electoral process for every citizen. From first-time voters to senior citizens eligible for postal ballots, VoteWise provides personalized, AI-driven guidance through every step of the democratic journey.

---

## 🎯 Chosen Vertical

**Civic Technology / Electoral Assistance (India)**

India conducts the world's largest democratic elections, yet millions of eligible citizens remain disenfranchised due to:
- **Complexity** of registration procedures (Form 6, booth verification, etc.)
- **Language barriers** across a nation with 22 official languages
- **Information asymmetry** — people don't know their rights (e.g., postal ballots for voters aged 80+)
- **First-time voter anxiety** — unfamiliarity with EVMs and the voting process

VoteWise directly tackles these barriers by making accurate electoral information conversational, personalized, and accessible in multiple Indian languages.

---

## 🧠 Approach and Logic

The solution is built around three core principles: **Personalization**, **Accuracy**, and **Accessibility**.

### 1. Conversational-First Design
Instead of static FAQs, users engage with a friendly AI chatbot. The journey begins by asking the user's age, which immediately personalizes the experience:
- **Under 18** → Explains eligibility and future registration
- **18–79** → Standard voter registration and guidance
- **80+** → Highlights postal ballot eligibility and special provisions

### 2. Retrieval-Augmented Generation (RAG)
To prevent hallucinations and ensure legally accurate responses, all AI answers are grounded in a curated local knowledge base (`src/rag/knowledgeBase.ts`) containing:
- Election Commission of India (ECI) guidelines
- Voter registration rules and deadlines
- Polling day procedures and rights
- Edge cases (NRI voting, postal ballots, VVPAT usage)

The retriever (`src/rag/retriever.ts`) performs keyword matching against user queries, injects relevant knowledge chunks into the Gemini prompt as context, and uses a lower temperature (0.2) for factual accuracy.

### 3. Multi-Key API Resilience
Different tasks use dedicated Gemini API keys:
- `GEMINI_API_KEY_CHAT` → Conversational responses (temperature: 0.7)
- `GEMINI_API_KEY_RAG` → Fact retrieval responses (temperature: 0.2)
- `GEMINI_API_KEY_BACKUP` → Automatic failover if rate limits (HTTP 429) are hit

### 4. Multilingual Support
A global `LanguageProvider` context manages UI translations via a `UI_STRINGS` map for static content. For dynamic AI responses, the Gemini system instruction is dynamically updated to enforce the user's chosen language (English, Hindi, Tamil, or Marathi), including culturally appropriate tone and honorifics.

---

## ⚙️ How the Solution Works

### Architecture Overview

```
User Browser
     │
     ▼
React Frontend (Vite + TypeScript)
     │
     ├── Chat.tsx         → AI conversation interface
     ├── Journey.tsx      → Dynamic voting roadmap generator
     ├── EVMSimulator.tsx → EVM practice simulator
     ├── FormWizard.tsx   → Step-by-step Form 6 guidance
     ├── Timeline.tsx     → Electoral calendar and deadlines
     └── BoothLocator.tsx → Polling booth information
     │
     ▼
Express Server (server.js)   ← Production API proxy
     │
     ├── POST /api/gemini      → Proxies to Google Gemini API
     │        └── Rate limiting (20 req/min per IP)
     │        └── Key rotation (chat → backup on 429)
     │
     └── POST /api/generate-pdf → Generates Form 6 prep PDF
              └── Uses pdf-lib for server-side PDF creation
     │
     ▼
Google Gemini API (gemini-2.0-flash / gemini-1.5-pro)
```

### Key Feature Flows

**AI Chat Flow:**
1. User sends a message → `useGemini.ts` hook intercepts
2. RAG retriever scans query against knowledge base keywords
3. Relevant context chunks are prepended to the Gemini prompt
4. Request proxied through `/api/gemini` (hides API keys from client)
5. Response rendered with DOMPurify-sanitized Markdown

**PDF Generation Flow:**
1. User fills Form 6 wizard → clicks "Download Prep Guide"
2. Frontend POSTs `{ name, dob, address }` to `/api/generate-pdf`
3. Express server uses `pdf-lib` to generate a Form 6 template PDF
4. PDF streamed back as a file download

**EVM Simulator:**
- Standalone interactive component simulating the EVM interface
- Teaches first-time voters about the voting button, VVPAT slip, etc.
- No API calls — entirely client-side for instant response

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | Tailwind CSS v4 |
| AI | Google Gemini API (gemini-2.0-flash-exp) |
| RAG | Custom keyword retriever + local knowledge base |
| Server | Express 5 (production API proxy) |
| PDF Generation | pdf-lib |
| Markdown | marked + DOMPurify |
| Voice Input | react-speech-recognition |
| PWA | vite-plugin-pwa (offline support) |
| Deployment | Google Cloud Run (containerized) |
| Container | Docker (node:20-slim) |
| Animations | CSS transitions + canvas-confetti |
| Testing | Vitest |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 20+
- A Google Gemini API key ([Get one free](https://aistudio.google.com/app/apikey))

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/sashwatpuri/Challenge-2-Prompt-Wars-.git
cd Challenge-2-Prompt-Wars-

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and add your Gemini API keys:
# VITE_GEMINI_API_KEY=your_key_here
# GEMINI_API_KEY_CHAT=your_key_here
# GEMINI_API_KEY_RAG=your_key_here
# GEMINI_API_KEY_BACKUP=your_key_here

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Running Tests

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

---

## ☁️ Production Deployment (Google Cloud Run)

### Build & Deploy

```bash
# 1. Build and push Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/votewise .

# 2. Deploy to Cloud Run
gcloud run deploy votewise \
  --image gcr.io/YOUR_PROJECT_ID/votewise \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY_CHAT=YOUR_KEY,GEMINI_API_KEY_RAG=YOUR_KEY,GEMINI_API_KEY_BACKUP=YOUR_KEY"
```

> **Security Note:** API keys are **never** bundled in the frontend build. They are injected as Cloud Run environment variables and accessed only through the server-side proxy at `/api/gemini`.

---

## 📋 Assumptions Made

1. **Gemini API Availability**: The solution assumes stable access to the Google Gemini API. The multi-key failover strategy mitigates rate limits, but extended outages would degrade the AI chat experience. Offline fallbacks are provided through PWA caching of the app shell.

2. **Translation Accuracy**: Dynamic content (RAG responses in Hindi, Tamil, Marathi) relies on Gemini's translation capability via system instructions. We assume this is sufficiently accurate for procedural understanding, though legal nuances may be better served by professional translation in a production government context.

3. **Browser Compatibility**: Modern browser support is assumed. Voice input (`react-speech-recognition` using the Web Speech API) degrades gracefully — the microphone button is hidden on unsupported browsers. The PWA install prompt also depends on browser support.

4. **Static Knowledge Base**: ECI electoral rules (e.g., the 80+ age limit for postal ballots, Form 6 requirements) are encoded in the local knowledge base. We assume these rules remain stable for the current election cycle. A production version would integrate with live ECI APIs or CMS updates.

5. **Single-Region Deployment**: The app is deployed in `europe-west1` for this challenge. A production deployment for Indian users would optimally be in `asia-south1` (Mumbai) for lower latency.

6. **User Honesty**: The age-based personalization flow assumes users enter their actual age. No identity verification is performed, which is appropriate for an informational guide but would be required for actual voter registration workflows.

---

## 📁 Project Structure

```
Challenge-2-Prompt-Wars-/
├── src/
│   ├── components/
│   │   ├── Chat.tsx          # Main AI chat interface
│   │   ├── EVMSimulator.tsx  # Interactive EVM practice
│   │   ├── FormWizard.tsx    # Form 6 step-by-step guide
│   │   ├── Journey.tsx       # Voting roadmap generator
│   │   ├── Timeline.tsx      # Electoral calendar
│   │   ├── BoothLocator.tsx  # Booth finder information
│   │   └── LanguageToggle.tsx # Language switcher
│   ├── rag/
│   │   ├── knowledgeBase.ts  # Curated ECI facts & guidelines
│   │   ├── retriever.ts      # Keyword-based RAG retriever
│   │   └── retriever.test.ts # Unit tests for RAG
│   ├── hooks/
│   │   └── useGemini.ts      # Gemini API integration hook
│   ├── context/
│   │   └── LanguageContext.tsx # Multilingual state management
│   └── constants/            # UI strings & config
├── server.js                 # Express production server
├── Dockerfile                # Cloud Run container config
├── .dockerignore
└── vite.config.ts            # Vite + PWA configuration
```

---

## 👥 Team

Built for **Challenge 2 — Prompt Wars** | Google Developer Student Clubs

---

*VoteWise — Because every vote counts, and every voter deserves to be heard.* 🇮🇳
