import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, ExternalLink, Search } from 'lucide-react';

export default function BoothLocator() {
  const { language } = useLanguage();

  const translations = {
    en: { title: 'Find Your Polling Booth', desc: 'Enter your details on the official Electoral Search portal to find your booth.', btn: 'Search on ECI Portal' },
    hi: { title: 'अपना मतदान केंद्र खोजें', desc: 'अपना बूथ खोजने के लिए आधिकारिक निर्वाचक खोज पोर्टल पर अपना विवरण दर्ज करें।', btn: 'ECI पोर्टल पर खोजें' },
    ta: { title: 'உங்கள் வாக்குச் சாவடியைக் கண்டறியவும்', desc: 'உங்கள் வாக்குச்சாவடியைக் கண்டறிய அதிகாரப்பூர்வ தேர்தல் தேடல் போர்ட்டலில் உங்கள் விவரங்களை உள்ளிடவும்.', btn: 'ECI போர்ட்டலில் தேடுக' },
    mr: { title: 'तुमचे मतदान केंद्र शोधा', desc: 'तुमचे बूथ शोधण्यासाठी अधिकृत इलेक्टोरल सर्च पोर्टलवर तुमचे तपशील प्रविष्ट करा.', btn: 'ECI पोर्टलवर शोधा' },
  };

  const strings = translations[language as keyof typeof translations] || translations.en;

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      <div className="p-4 bg-white border-b sticky top-0 z-10 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">{strings.title}</h2>
      </div>
      
      <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <MapPin size={48} className="text-[var(--color-india-blue)]" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-4">{strings.title}</h3>
        <p className="text-gray-600 mb-8 max-w-md text-lg">
          {strings.desc}
        </p>
        
        <a 
          href="https://electoralsearch.eci.gov.in/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-8 py-4 bg-[var(--color-india-blue)] text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors shadow-lg active:scale-95"
        >
          <Search size={22} />
          <span className="text-lg">{strings.btn}</span>
          <ExternalLink size={18} className="ml-2 opacity-70" />
        </a>
      </div>
    </div>
  );
}
