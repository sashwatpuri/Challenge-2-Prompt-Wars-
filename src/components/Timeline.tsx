import { useState } from 'react';
import { TIMELINE_PHASES, CURRENT_TIMELINE_PHASE } from '../constants/electionData';
import { CheckCircle2, Circle, Clock, Sparkles } from 'lucide-react';
import { useGemini } from '../hooks/useGemini';

export default function Timeline() {
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [narration, setNarration] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { retrieveAndAnswer } = useGemini();

  const handlePhaseClick = async (phase: typeof TIMELINE_PHASES[0]) => {
    if (activePhase === phase.id) {
      setActivePhase(null);
      setNarration(null);
      return;
    }
    
    setActivePhase(phase.id);
    setLoading(true);
    const text = await retrieveAndAnswer(`Explain the importance of the "${phase.title}" phase in an Indian election.`);
    setNarration(text);
    setLoading(false);
  };

  const currentIndex = TIMELINE_PHASES.findIndex(p => p.id === CURRENT_TIMELINE_PHASE);

  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
      <h3 className="text-lg font-bold text-[var(--color-navy-blue)] mb-6 flex items-center gap-2">
        <Clock size={20} /> Election Timeline
      </h3>
      
      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 rounded-full z-0"></div>
        <div 
          className="absolute top-5 left-0 h-1 bg-[var(--color-saffron)] rounded-full z-0 transition-all duration-500"
          style={{ width: `${(currentIndex / (TIMELINE_PHASES.length - 1)) * 100}%` }}
        ></div>

        <div className="flex justify-between items-start relative z-10">
          {TIMELINE_PHASES.map((phase, index) => {
            const isPast = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div 
                key={phase.id} 
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => handlePhaseClick(phase)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform transform group-hover:scale-110 ${
                  isCurrent ? 'bg-[var(--color-saffron)] text-white shadow-lg ring-4 ring-orange-100' : 
                  isPast ? 'bg-[var(--color-deep-green)] text-white' : 
                  'bg-white border-2 border-gray-300 text-gray-400'
                }`}>
                  {isPast ? <CheckCircle2 size={20} /> : <Circle size={20} className={isCurrent ? 'fill-white' : ''} />}
                </div>
                
                <div className="mt-3 text-center max-w-[100px]">
                  <p className={`text-xs font-bold ${isCurrent ? 'text-[var(--color-saffron)]' : 'text-gray-700'}`}>
                    {phase.title}
                  </p>
                  {isCurrent && (
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-saffron)] font-bold mt-1 block">
                      You are here
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activePhase && (
        <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-100 animate-in fade-in slide-in-from-top-4 flex gap-4 items-start">
          <div className="bg-[var(--color-saffron)] p-2 rounded-full text-white shrink-0 mt-1">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="font-bold text-[var(--color-saffron)] mb-1">
              {TIMELINE_PHASES.find(p => p.id === activePhase)?.title}
            </h4>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
              </div>
            ) : (
              <p className="text-gray-700 text-sm">{narration}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
