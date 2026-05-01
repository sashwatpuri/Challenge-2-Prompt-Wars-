import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AlertCircle, FileText, ChevronRight, CheckCircle } from 'lucide-react';

export default function FormWizard() {
  const { language } = useLanguage();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', dob: '', address: '' });

  const disclaimers = {
    en: "DISCLAIMER: This is a preparation tool only. Filling this out does NOT submit your application to the government.",
    hi: "अस्वीकरण: यह केवल एक तैयारी उपकरण है। इसे भरने से आपका आवेदन सरकार को जमा नहीं होता है।",
    ta: "பொறுப்பு துறப்பு: இது ஒரு தயாரிப்பு கருவி மட்டுமே. இதை நிரப்புவது உங்கள் விண்ணப்பத்தை அரசாங்கத்திடம் சமர்ப்பிக்காது.",
    mr: "अस्वीकरण: हे केवळ एक तयारी साधन आहे. हे भरल्याने तुमचा अर्ज सरकारकडे जमा होत नाही."
  };

  const ui = {
    en: { title: 'Form 6 Preparation', step1: 'Personal Details', step2: 'Address', step3: 'Review', next: 'Next', finish: 'Finish Preparation & Go to NVSP' },
    hi: { title: 'फॉर्म 6 की तैयारी', step1: 'व्यक्तिगत विवरण', step2: 'पता', step3: 'समीक्षा', next: 'अगला', finish: 'तैयारी समाप्त करें और NVSP पर जाएं' },
    ta: { title: 'படிவம் 6 தயாரிப்பு', step1: 'தனிப்பட்ட விவரங்கள்', step2: 'முகவரி', step3: 'விமர்சனம்', next: 'அடுத்து', finish: 'தயாரிப்பை முடித்து NVSP க்குச் செல்லவும்' },
    mr: { title: 'फॉर्म 6 ची तयारी', step1: 'वैयक्तिक तपशील', step2: 'पत्ता', step3: 'पुनरावलोकन', next: 'पुढे', finish: 'तयारी पूर्ण करा आणि NVSP वर जा' }
  };

  const str = ui[language as keyof typeof ui] || ui.en;
  const disclaimer = disclaimers[language as keyof typeof disclaimers] || disclaimers.en;

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto pb-20">
      <div className="p-4 bg-white border-b sticky top-0 z-10 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">{str.title}</h2>
      </div>

      <div className="p-4 bg-red-50 border-l-4 border-red-500 m-4 rounded shadow-sm flex items-start gap-3">
        <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-red-800 font-bold leading-tight">{disclaimer}</p>
      </div>

      <div className="flex-1 p-4">
        {step === 1 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText size={20} className="text-blue-500"/> {str.step1}</h3>
            <label className="block mb-2 text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-[var(--color-india-blue)] outline-none transition-shadow" placeholder="E.g. Rahul Sharma" />
            
            <label className="block mb-2 text-sm font-medium text-gray-700">Date of Birth</label>
            <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full p-3 border rounded-lg mb-6 focus:ring-2 focus:ring-[var(--color-india-blue)] outline-none transition-shadow" />
            
            <button onClick={() => setStep(2)} className="w-full py-3 bg-[var(--color-india-blue)] text-white rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-blue-800 transition-colors shadow-md active:scale-[0.98]">{str.next} <ChevronRight size={18} /></button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText size={20} className="text-blue-500"/> {str.step2}</h3>
            <label className="block mb-2 text-sm font-medium text-gray-700">Complete Address</label>
            <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-3 border rounded-lg mb-6 h-32 focus:ring-2 focus:ring-[var(--color-india-blue)] outline-none resize-none transition-shadow" placeholder="Enter your full residential address..."></textarea>
            
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors">Back</button>
              <button onClick={() => setStep(3)} className="flex-[2] py-3 bg-[var(--color-india-blue)] text-white rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-blue-800 transition-colors shadow-md active:scale-[0.98]">{str.next} <ChevronRight size={18} /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><CheckCircle size={20} className="text-green-500"/> {str.step3}</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Name</p>
              <p className="font-medium mb-3">{formData.name || '-'}</p>
              
              <p className="text-sm text-gray-500 mb-1">Date of Birth</p>
              <p className="font-medium mb-3">{formData.dob || '-'}</p>
              
              <p className="text-sm text-gray-500 mb-1">Address</p>
              <p className="font-medium">{formData.address || '-'}</p>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="w-1/3 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors">Back</button>
              <a href="https://voters.eci.gov.in/" target="_blank" rel="noopener noreferrer" className="w-2/3 py-3 bg-[var(--color-india-green)] text-white rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-green-700 transition-colors shadow-md text-center text-sm px-2">
                {str.finish} <ChevronRight size={18} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
