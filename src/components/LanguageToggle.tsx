import type { Language } from '../App';
import { Languages } from 'lucide-react';

interface LanguageToggleProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export default function LanguageToggle({ language, setLanguage }: LanguageToggleProps) {
  const toggle = () => {
    if (language === 'en') {
      alert("Hindi AI Translation is 'Coming Soon' for the MVP! UI will stay in English for now.");
      setLanguage('hi');
    } else {
      setLanguage('en');
    }
  };

  return (
    <button 
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium"
      aria-label="Toggle language"
    >
      <Languages size={16} className="text-[var(--color-saffron)]" />
      <span className={language === 'en' ? 'text-gray-900 font-bold' : 'text-gray-500'}>EN</span>
      <span className="text-gray-300">|</span>
      <span className={language === 'hi' ? 'text-gray-900 font-bold' : 'text-gray-500'}>HI</span>
    </button>
  );
}
