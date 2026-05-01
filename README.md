# VoteWise

VoteWise is India's Friendly Election Guide, an AI-powered platform designed to demystify the voting process for Indian citizens. It acts as a personalized assistant to guide users through the electoral journey, from registration to casting their vote, using conversational AI and interactive features.

## Vertical Chosen
**Civic Technology / Electoral Assistance (India)**
We chose to focus on the democratic process in India by creating an accessible, multilingual voting guide. The platform addresses the complexity of electoral procedures (like Form 6 for registration), eligibility edge cases (such as postal ballots for senior citizens above 80), and language barriers that often deter citizens from participating in the democratic process.

## Approach and Logic
Our approach is built around **Personalization**, **Accessibility**, and **Reliability**:

1. **Conversational First**: Instead of reading long manuals, users interact with a friendly AI. The journey starts by asking the user's age to immediately tailor the guidance (e.g., handling underage users vs. eligible first-time voters vs. senior citizens).
2. **Retrieval-Augmented Generation (RAG)**: To ensure the AI provides accurate, legally sound advice, we implemented a RAG system. The AI queries a local knowledge base (`knowledgeBase.ts`) containing curated facts about the Election Commission of India (ECI) guidelines, voting rights, polling day rules, and edge cases.
3. **Multilingual Support**: India's diversity necessitates regional language support. We implemented a unified translation system (`UI_STRINGS`) for static UI elements and dynamic language-aware AI prompting (supporting English, Hindi, Tamil, and Marathi) so that the generated responses adhere strictly to the user's preferred language and culturally appropriate tone.
4. **Resilience**: We implemented a multi-API key strategy. Different tasks (conversational chat vs. RAG retrieval) use dedicated Gemini API keys. We also built in an automatic failover mechanism that switches to a backup key if rate limits (HTTP 429) are encountered.

## How the Solution Works
- **Interactive Chatbot**: Powered by Google's Gemini API, the chatbot guides the user step-by-step.
- **RAG Architecture**: User queries are matched against predefined keywords in our knowledge base. Relevant chunks (like voting queue rules or postal ballot eligibility) are injected into the Gemini prompt as context, ensuring hallucination-free, factual responses.
- **Dynamic Roadmaps**: Based on the chat context, the app can generate a visual "Voting Journey" roadmap, showing users exactly what steps they need to take (e.g., Register -> Verify Name -> Go to Polling Booth -> Vote).
- **EVM Simulator**: A built-in feature allows first-time voters to familiarize themselves with the Electronic Voting Machine interface in a risk-free environment.
- **Language Context**: A global `LanguageProvider` handles UI localizations seamlessly, while system instructions to the LLM are dynamically updated to enforce the active language.

## Assumptions Made
1. **API Availability**: We assume stable access to the Google Gemini API. While we implemented rate-limit fallbacks, extended outages would degrade the AI chat experience (though offline cached procedural guides are planned/implemented as fallbacks).
2. **Translation Quality**: We assume the LLM's on-the-fly translation for dynamic content (RAG responses in Hindi, Tamil, Marathi) is sufficiently accurate for procedural understanding, though we acknowledge that highly specific legal nuances might drift slightly compared to human translation.
3. **Browser Compatibility**: We assume modern browser usage. For example, voice input features rely on `react-speech-recognition`, and we assume graceful degradation (hiding the mic button) on unsupported browsers like certain versions of iOS Safari.
4. **Static Knowledge Base**: We assume the election rules (like the 80+ age limit for postal ballots) remain static for the current election cycle, as they are hardcoded into our local RAG knowledge base rather than fetched from a live government API.
