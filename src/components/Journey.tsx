import { useState } from 'react';
import type { JourneyStep, Screen } from '../App';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Sparkles, ArrowRight, FileText, MapPin, Share2 } from 'lucide-react';

interface JourneyProps {
  journeySteps: JourneyStep[];
  setJourneySteps: React.Dispatch<React.SetStateAction<JourneyStep[]>>;
  setCurrentScreen: React.Dispatch<React.SetStateAction<Screen>>;
  sendMessage: (msg: string, isJourney: boolean) => Promise<string>;
  retrieveAndAnswer: (query: string) => Promise<string>;
}

export default function Journey({ journeySteps, setJourneySteps, setCurrentScreen, sendMessage, retrieveAndAnswer }: JourneyProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);

  const toggleStep = (id: string) => {
    setJourneySteps(steps => 
      steps.map(step => step.id === id ? { ...step, completed: !step.completed } : step)
    );
  };

  const handleExplain = async (step: JourneyStep) => {
    if (expandedStep === step.id) {
      setExpandedStep(null);
      return;
    }

    setExpandedStep(step.id);
    
    if (!explanations[step.id]) {
      setLoadingExplanation(step.id);
      const explanation = await retrieveAndAnswer(`Explain the step "${step.title}" - "${step.description}"`);
      setExplanations(prev => ({ ...prev, [step.id]: explanation }));
      setLoadingExplanation(null);
    }
  };

  const handleShare = () => {
    const text = `Here is my voting roadmap from VoteWise:\n` + journeySteps.map((s, i) => `${i+1}. ${s.title} ${s.completed ? '✅' : '⏳'}`).join('\n');
    window.open(`whatsapp://send?text=${encodeURIComponent(text)}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-[var(--color-navy-blue)] mb-2">Your Personal Voting Journey</h2>
        <p className="text-gray-600 mb-6">Complete these steps to cast your vote successfully.</p>
        
        <div className="space-y-4">
          {journeySteps.map((step, index) => (
            <div key={step.id} className={`border rounded-xl transition-all ${step.completed ? 'border-[var(--color-deep-green)] bg-green-50' : 'border-gray-200 bg-white'}`}>
              <div className="p-4 flex items-start gap-4">
                <button 
                  onClick={() => toggleStep(step.id)}
                  className={`mt-1 flex-shrink-0 transition-colors ${step.completed ? 'text-[var(--color-deep-green)]' : 'text-gray-300 hover:text-gray-400'}`}
                >
                  {step.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg ${step.completed ? 'text-[var(--color-deep-green)] line-through opacity-70' : 'text-gray-900'}`}>
                    Step {index + 1}: {step.title}
                  </h3>
                  <p className={`text-sm mt-1 ${step.completed ? 'text-green-700 opacity-70' : 'text-gray-600'}`}>
                    {step.description}
                  </p>
                  
                  <button 
                    onClick={() => handleExplain(step)}
                    className="mt-3 flex items-center gap-1 text-sm font-medium text-[var(--color-saffron)] hover:text-orange-600 transition-colors"
                  >
                    <Sparkles size={16} /> 
                    {expandedStep === step.id ? 'Hide explanation' : 'AI: Explain this'}
                    {expandedStep === step.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  {expandedStep === step.id && (
                    <div className="mt-3 p-4 bg-orange-50 rounded-lg text-gray-800 text-sm border border-orange-100 animate-in fade-in slide-in-from-top-2">
                      {loadingExplanation === step.id ? (
                        <div className="flex items-center gap-2 text-gray-500">
                          <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                        </div>
                      ) : (
                        <p>{explanations[step.id]}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => setCurrentScreen('formWizard')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-[var(--color-india-blue)] border-2 border-[var(--color-india-blue)] rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-sm"
        >
          <FileText size={18} /> Prepare Form 6
        </button>
        <button 
          onClick={() => setCurrentScreen('boothLocator')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-[var(--color-saffron)] border-2 border-[var(--color-saffron)] rounded-xl font-bold hover:bg-orange-50 transition-colors shadow-sm"
        >
          <MapPin size={18} /> Find My Booth
        </button>
        <button 
          onClick={handleShare}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-[var(--color-india-green)] border-2 border-[var(--color-india-green)] rounded-xl font-bold hover:bg-green-50 transition-colors shadow-sm"
        >
          <Share2 size={18} /> Share Roadmap
        </button>
      </div>

      <div className="flex justify-center mt-6">
        <button 
          onClick={() => setCurrentScreen('evm')}
          className="flex items-center gap-2 px-8 py-4 bg-[var(--color-navy-blue)] text-white rounded-full font-bold shadow-lg hover:bg-blue-900 transition-colors transform hover:scale-105"
        >
          Proceed to EVM Simulator <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
