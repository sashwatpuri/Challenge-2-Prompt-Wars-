/**
 * FormWizard.tsx — Form 6 Preparation Wizard
 *
 * A 3-step form that helps users prepare their Form 6 application
 * (Application for inclusion of name in the electoral roll).
 *
 * IMPORTANT: This does NOT submit the form to the government.
 * It is a preparation and familiarisation tool only.
 * At the final step, users are directed to voters.eci.gov.in for the official submission.
 *
 * Steps:
 *  1. Personal Details — Full name and date of birth
 *  2. Address — Full residential address
 *  3. Review & Download — Preview entered data and download a preparation PDF
 */

import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AlertCircle, FileText, ChevronRight, CheckCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  dob: string;
  address: string;
}

// ─── Localised Strings ────────────────────────────────────────────────────────

const disclaimers: Record<string, string> = {
  en: 'DISCLAIMER: This is a preparation tool only. Filling this out does NOT submit your application to the government.',
  hi: 'अस्वीकरण: यह केवल एक तैयारी उपकरण है। इसे भरने से आपका आवेदन सरकार को जमा नहीं होता है।',
  ta: 'பொறுப்பு துறப்பு: இது ஒரு தயாரிப்பு கருவி மட்டுமே. இதை நிரப்புவது உங்கள் விண்ணப்பத்தை அரசாங்கத்திடம் சமர்ப்பிக்காது.',
  mr: 'अस्वीकरण: हे केवळ एक तयारी साधन आहे. हे भरल्याने तुमचा अर्ज सरकारकडे जमा होत नाही.',
};

const ui: Record<string, Record<string, string>> = {
  en: {
    title: 'Form 6 Preparation', step1: 'Personal Details', step2: 'Address', step3: 'Review',
    next: 'Next', finish: 'Finish Preparation & Go to NVSP',
    fullName: 'Full Name', fullNamePlaceholder: 'E.g. Rahul Sharma',
    dob: 'Date of Birth', completeAddress: 'Complete Address',
    addressPlaceholder: 'Enter your full residential address...',
    back: 'Back', name: 'Name', address: 'Address',
    downloadPdf: 'Download PDF', generating: 'Generating...',
  },
  hi: {
    title: 'फॉर्म 6 की तैयारी', step1: 'व्यक्तिगत विवरण', step2: 'पता', step3: 'समीक्षा',
    next: 'अगला', finish: 'तैयारी समाप्त करें और NVSP पर जाएं',
    fullName: 'पूरा नाम', fullNamePlaceholder: 'उदा. राहुल शर्मा',
    dob: 'जन्म तिथि', completeAddress: 'पूरा पता',
    addressPlaceholder: 'अपना पूरा आवासीय पता दर्ज करें...',
    back: 'वापस', name: 'नाम', address: 'पता',
    downloadPdf: 'PDF डाउनलोड करें', generating: 'उत्पन्न हो रहा है...',
  },
  ta: {
    title: 'படிவம் 6 தயாரிப்பு', step1: 'தனிப்பட்ட விவரங்கள்', step2: 'முகவரி', step3: 'விமர்சனம்',
    next: 'அடுத்து', finish: 'தயாரிப்பை முடித்து NVSP க்குச் செல்லவும்',
    fullName: 'முழு பெயர்', fullNamePlaceholder: 'உ.ம். ராகுல் சர்மா',
    dob: 'பிறந்த தேதி', completeAddress: 'முழு முகவரி',
    addressPlaceholder: 'உங்கள் முழு குடியிருப்பு முகவரியை உள்ளிடவும்...',
    back: 'பின்னால்', name: 'பெயர்', address: 'முகவரி',
    downloadPdf: 'PDF பதிவிறக்கவும்', generating: 'உருவாக்கப்படுகிறது...',
  },
  mr: {
    title: 'फॉर्म 6 ची तयारी', step1: 'वैयक्तिक तपशील', step2: 'पत्ता', step3: 'पुनरावलोकन',
    next: 'पुढे', finish: 'तयारी पूर्ण करा आणि NVSP वर जा',
    fullName: 'पूर्ण नाव', fullNamePlaceholder: 'उदा. राहुल शर्मा',
    dob: 'जन्मतारीख', completeAddress: 'पूर्ण पत्ता',
    addressPlaceholder: 'तुमचा पूर्ण रहिवासी पत्ता प्रविष्ट करा...',
    back: 'मागे', name: 'नाव', address: 'पत्ता',
    downloadPdf: 'PDF डाउनलोड करा', generating: 'तयार होत आहे...',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function FormWizard() {
  const { language } = useLanguage();

  const str        = ui[language] || ui.en;
  const disclaimer = disclaimers[language] || disclaimers.en;

  const [step, setStep]           = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData]   = useState<FormData>({ name: '', dob: '', address: '' });

  // ─── Handlers ────────────────────────────────────────────────────────────

  /** Calls the PDF generation endpoint and triggers a browser download. */
  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      // Create a temporary anchor to trigger the download without a page navigation
      const blob   = await response.blob();
      const url    = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href     = url;
      anchor.download = 'Form6_Prep.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('[FormWizard] PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Shared input styles ─────────────────────────────────────────────────

  const inputClass = 'w-full p-3 border rounded-lg focus:ring-2 focus:ring-[var(--color-india-blue)] outline-none transition-shadow';

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto pb-20">
      {/* Sticky header */}
      <div className="p-4 bg-white border-b sticky top-0 z-10 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">{str.title}</h2>
      </div>

      {/* Disclaimer banner */}
      <div className="p-4 bg-red-50 border-l-4 border-red-500 m-4 rounded shadow-sm flex items-start gap-3">
        <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-red-800 font-bold leading-tight">{disclaimer}</p>
      </div>

      <div className="flex-1 p-4">
        {/* ── Step 1: Personal Details ── */}
        {step === 1 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-500" /> {str.step1}
            </h3>

            <label className="block mb-2 text-sm font-medium text-gray-700">{str.fullName}</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder={str.fullNamePlaceholder}
              className={`${inputClass} mb-4`}
            />

            <label className="block mb-2 text-sm font-medium text-gray-700">{str.dob}</label>
            <input
              type="date"
              value={formData.dob}
              onChange={e => setFormData({ ...formData, dob: e.target.value })}
              className={`${inputClass} mb-6`}
            />

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-[var(--color-india-blue)] text-white rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-blue-800 transition-colors shadow-md active:scale-[0.98]"
            >
              {str.next} <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ── Step 2: Address ── */}
        {step === 2 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-500" /> {str.step2}
            </h3>

            <label className="block mb-2 text-sm font-medium text-gray-700">{str.completeAddress}</label>
            <textarea
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder={str.addressPlaceholder}
              className={`${inputClass} mb-6 h-32 resize-none`}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
              >
                {str.back}
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-[2] py-3 bg-[var(--color-india-blue)] text-white rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-blue-800 transition-colors shadow-md active:scale-[0.98]"
              >
                {str.next} <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Review & Download ── */}
        {step === 3 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-500" /> {str.step3}
            </h3>

            {/* Summary of entered data */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">{str.name}</p>
              <p className="font-medium mb-3">{formData.name || '-'}</p>

              <p className="text-sm text-gray-500 mb-1">{str.dob}</p>
              <p className="font-medium mb-3">{formData.dob || '-'}</p>

              <p className="text-sm text-gray-500 mb-1">{str.address}</p>
              <p className="font-medium">{formData.address || '-'}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {/* Download preparation PDF */}
              <button
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="w-full py-3 bg-[var(--color-navy-blue)] text-white rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-blue-900 transition-colors shadow-md disabled:opacity-70 text-sm px-2"
              >
                <FileText size={18} />
                {isGenerating ? str.generating : str.downloadPdf}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                >
                  {str.back}
                </button>

                {/* Link to official ECI NVSP portal for actual submission */}
                <a
                  href="https://voters.eci.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-2/3 py-3 bg-[var(--color-india-green)] text-white rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-green-700 transition-colors shadow-md text-center text-sm px-2"
                >
                  {str.finish} <ChevronRight size={18} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
