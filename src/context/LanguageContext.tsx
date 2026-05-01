import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'mr';

export const UI_STRINGS = {
  en: {
    'app.title': 'VoteWise',
    'app.subtitle': 'Ask me anything about voting!',
    'chat.placeholder': 'Type your message...',
    'chat.greeting': "Namaste! Welcome to VoteWise, your personal election guide. I'm here to make voting easy. To get started, how old are you?",
    'journey.preparing': "Perfect! I'm creating your personalized voting roadmap now...",
    'error.fallback': "Oops, something went wrong",
    'error.reload': "Reload Page",
    'error.offline': "You are currently offline. Please refer to your saved journey steps or the cached procedural guides. Full AI capabilities will resume when you reconnect to the internet.",
    appName: 'VoteWise',
    tagline: "India's Friendly Election Guide",
    stepPrefix: 'Step',
    explainCta: 'AI: Explain this',
    hideExplain: 'Hide explanation',
    proceedEvm: 'Proceed to EVM Simulator',
    backJourney: 'Back to Journey',
    chatPlaceholder: 'Type your message...',
    electionTimeline: 'Election Timeline',
    youAreHere: 'You are here',
    votingJourneyTitle: 'Your Personal Voting Journey',
    votingJourneySubtitle: 'Complete these steps to cast your vote successfully.',
    greeting: "Namaste! Welcome to VoteWise. To get started, how old are you?",
  },
  hi: {
    'app.title': 'वोटवाइज (VoteWise)',
    'app.subtitle': 'मतदान के बारे में कुछ भी पूछें!',
    'chat.placeholder': 'अपना संदेश टाइप करें...',
    'chat.greeting': "नमस्ते! वोटवाइज में आपका स्वागत है, जो आपका व्यक्तिगत चुनाव गाइड है। मैं यहां मतदान को आसान बनाने के लिए हूं। शुरू करने के लिए, आपकी उम्र क्या है?",
    'journey.preparing': "बहुत बढ़िया! मैं अब आपका व्यक्तिगत मतदान रोडमैप बना रहा हूं...",
    'error.fallback': "उफ़, कुछ गलत हो गया",
    'error.reload': "पेज रीलोड करें",
    'error.offline': "आप वर्तमान में ऑफ़लाइन हैं। कृपया अपने सहेजे गए यात्रा चरणों या कैश किए गए मार्गदर्शिकाओं को देखें। जब आप इंटरनेट से फिर से जुड़ेंगे तो एआई क्षमताएं फिर से शुरू हो जाएंगी।",
    appName: 'वोटवाइज़',
    tagline: 'आपका चुनाव मार्गदर्शक',
    stepPrefix: 'चरण',
    explainCta: 'AI: समझाएं',
    hideExplain: 'छुपाएं',
    proceedEvm: 'EVM सिम्युलेटर पर जाएं',
    backJourney: 'वापस जाएं',
    chatPlaceholder: 'अपना संदेश लिखें...',
    electionTimeline: 'चुनाव समयरेखा',
    youAreHere: 'आप यहाँ हैं',
    votingJourneyTitle: 'आपकी व्यक्तिगत मतदान यात्रा',
    votingJourneySubtitle: 'सफलतापूर्वक मतदान करने के लिए इन चरणों को पूरा करें।',
    greeting: 'नमस्ते! VoteWise में आपका स्वागत है। शुरू करने के लिए, आपकी उम्र क्या है?',
  },
  ta: {
    'app.title': 'VoteWise (வாக்காளர் வழிகாட்டி)',
    'app.subtitle': 'வாக்களிப்பது பற்றி எதையும் கேளுங்கள்!',
    'chat.placeholder': 'உங்கள் செய்தியை உள்ளிடவும்...',
    'chat.greeting': "வணக்கம்! உங்கள் தனிப்பட்ட தேர்தல் வழிகாட்டியான VoteWise க்கு வரவேற்கிறோம். தொடங்குவதற்கு, உங்கள் வயது என்ன?",
    'journey.preparing': "அருமை! உங்களின் தனிப்பட்ட வாக்களிப்பு வழிகாட்டியை இப்போது உருவாக்குகிறேன்...",
    'error.fallback': "ஐயோ, ஏதோ தவறு நடந்துவிட்டது",
    'error.reload': "பக்கத்தை மீண்டும் ஏற்றுக",
    'error.offline': "நீங்கள் தற்போது ஆஃப்லைனில் உள்ளீர்கள். உங்கள் சேமிக்கப்பட்ட பயணப் படிகள் அல்லது தற்காலிக சேமிப்பு வழிகாட்டிகளைப் பார்க்கவும். நீங்கள் இணையத்துடன் மீண்டும் இணைக்கப்படும்போது AI திறன்கள் தொடங்கும்.",
    appName: 'வோட்வைஸ்',
    tagline: 'உங்கள் தேர்தல் வழிகாட்டி',
    stepPrefix: 'படி',
    explainCta: 'AI: விளக்குங்கள்',
    hideExplain: 'மறை',
    proceedEvm: 'EVM சிமுலேட்டருக்கு செல்லுங்கள்',
    backJourney: 'பயணத்திற்கு திரும்பு',
    chatPlaceholder: 'உங்கள் செய்தியை தட்டச்சு செய்யுங்கள்...',
    electionTimeline: 'தேர்தல் காலவரிசை',
    youAreHere: 'நீங்கள் இங்கே இருக்கிறீர்கள்',
    votingJourneyTitle: 'உங்கள் தனிப்பட்ட வாக்களிப்பு பயணம்',
    votingJourneySubtitle: 'வெற்றிகரமாக வாக்களிக்க இந்த படிகளை முடிக்கவும்.',
    greeting: 'வணக்கம்! VoteWise-க்கு வருக. தொடங்க, உங்கள் வயது என்ன?',
  },
  mr: {
    'app.title': 'VoteWise (व्होटवाईज)',
    'app.subtitle': 'मतदानाबद्दल काहीही विचारा!',
    'chat.placeholder': 'तुमचा संदेश टाईप करा...',
    'chat.greeting': "नमस्कार! VoteWise मध्ये आपले स्वागत आहे, तुमचा वैयक्तिक निवडणूक मार्गदर्शक. मी येथे मतदान सोपे करण्यासाठी आहे. सुरू करण्यासाठी, तुमचे वय किती आहे?",
    'journey.preparing': "उत्तम! मी आता तुमचा वैयक्तिक मतदान रोडमॅप तयार करत आहे...",
    'error.fallback': "अरेरे, काहीतरी चूक झाली",
    'error.reload': "पृष्ठ रीलोड करा",
    'error.offline': "तुम्ही सध्या ऑफलाइन आहात. कृपया तुमच्या जतन केलेल्या प्रवासाच्या पायऱ्या किंवा कॅशे केलेले मार्गदर्शक पहा. तुम्ही इंटरनेटशी पुन्हा कनेक्ट झाल्यावर AI क्षमता पुन्हा सुरू होतील.",
    appName: 'व्होटवाइज़',
    tagline: 'तुमचा निवडणूक मार्गदर्शक',
    stepPrefix: 'पायरी',
    explainCta: 'AI: समजावून सांगा',
    hideExplain: 'लपवा',
    proceedEvm: 'EVM सिम्युलेटरवर जा',
    backJourney: 'परत जा',
    chatPlaceholder: 'तुमचा संदेश टाइप करा...',
    electionTimeline: 'निवडणूक कालरेषा',
    youAreHere: 'तुम्ही येथे आहात',
    votingJourneyTitle: 'तुमचा वैयक्तिक मतदान प्रवास',
    votingJourneySubtitle: 'यशस्वीरित्या मतदान करण्यासाठी हे टप्पे पूर्ण करा.',
    greeting: 'नमस्कार! VoteWise मध्ये आपले स्वागत आहे. सुरुवात करण्यासाठी, तुमचे वय किती आहे?',
  }
} as const;

type TranslationsKey = keyof typeof UI_STRINGS.en;

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationsKey | string) => string;
}


const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  const t = (key: TranslationsKey | string) => {
    // Cast necessary because TypeScript doesn't know string is a valid key if it's not strictly a TranslationsKey
    return (UI_STRINGS[language] as Record<string, string>)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
