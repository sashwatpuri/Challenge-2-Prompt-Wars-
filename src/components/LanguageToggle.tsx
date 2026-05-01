import { Languages } from 'lucide-react';
import { useLanguage, type SupportedLanguage } from '../context/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as SupportedLanguage);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white shadow-sm">
      <Languages size={16} className="text-[var(--color-saffron)]" />
      <select 
        value={language}
        onChange={handleLanguageChange}
        className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
        aria-label="Toggle language"
      >
        <option value="en">English</option>
        <option value="hi">हिंदी (Hindi)</option>
        <option value="ta">தமிழ் (Tamil)</option>
        <option value="mr">मराठी (Marathi)</option>
      </select>
    </div>
  );
}
