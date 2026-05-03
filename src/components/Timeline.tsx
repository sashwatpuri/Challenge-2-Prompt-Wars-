/**
 * Timeline.tsx — Indian Election Timeline
 *
 * Displays the phases of the Indian election process as a horizontal progress bar.
 * Each phase node is clickable and triggers an AI-generated explanation panel below.
 *
 * Visual states:
 *  - Past phases   : Filled green with a checkmark
 *  - Current phase : Saffron with a "You Are Here" label and highlight ring
 *  - Future phases : Hollow circle with grey border
 *
 * The connecting bar fills from left to right based on how many phases have passed.
 */

import { useState } from 'react';
import { TIMELINE_PHASES, CURRENT_TIMELINE_PHASE } from '../constants/electionData';
import { CheckCircle2, Circle, Clock, Sparkles } from 'lucide-react';
import { useGemini } from '../hooks/useGemini';
import { useLanguage } from '../context/LanguageContext';

export default function Timeline() {
  const { retrieveAndAnswer } = useGemini();
  const { t } = useLanguage();

  // ID of the currently expanded phase (null = collapsed)
  const [activePhase, setActivePhase] = useState<string | null>(null);

  // AI-generated narration for the active phase
  const [narration, setNarration] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  // Index of the current phase used to compute the progress bar fill width
  const currentIndex = TIMELINE_PHASES.findIndex(p => p.id === CURRENT_TIMELINE_PHASE);

  /**
   * Handles clicking a timeline phase node.
   * Collapses the panel if already open, otherwise fetches an AI explanation.
   */
  const handlePhaseClick = async (phase: typeof TIMELINE_PHASES[0]) => {
    if (activePhase === phase.id) {
      setActivePhase(null);
      setNarration(null);
      return;
    }

    setActivePhase(phase.id);
    setLoading(true);
    const text = await retrieveAndAnswer(
      `Explain the importance of the "${phase.title}" phase in an Indian election.`
    );
    setNarration(text);
    setLoading(false);
  };

  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
      <h3 className="text-lg font-bold text-[var(--color-navy-blue)] mb-6 flex items-center gap-2">
        <Clock size={20} /> {t('electionTimeline')}
      </h3>

      {/* Progress track */}
      <div className="relative">
        {/* Full grey track */}
        <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 rounded-full z-0" />

        {/* Saffron fill — proportional to phases completed */}
        <div
          className="absolute top-5 left-0 h-1 bg-[var(--color-saffron)] rounded-full z-0 transition-all duration-500"
          style={{ width: `${(currentIndex / (TIMELINE_PHASES.length - 1)) * 100}%` }}
        />

        {/* Phase nodes */}
        <div className="flex justify-between items-start relative z-10">
          {TIMELINE_PHASES.map((phase, index) => {
            const isPast    = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div
                key={phase.id}
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => handlePhaseClick(phase)}
                role="button"
                aria-label={`${phase.title} — click to learn more`}
              >
                {/* Phase circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform transform group-hover:scale-110 ${
                    isCurrent ? 'bg-[var(--color-saffron)] text-white shadow-lg ring-4 ring-orange-100' :
                    isPast    ? 'bg-[var(--color-deep-green)] text-white' :
                                'bg-white border-2 border-gray-300 text-gray-400'
                  }`}
                >
                  {isPast ? <CheckCircle2 size={20} /> : <Circle size={20} className={isCurrent ? 'fill-white' : ''} />}
                </div>

                {/* Phase label */}
                <div className="mt-3 text-center max-w-[100px]">
                  <p className={`text-xs font-bold ${isCurrent ? 'text-[var(--color-saffron)]' : 'text-gray-700'}`}>
                    {phase.title}
                  </p>
                  {isCurrent && (
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-saffron)] font-bold mt-1 block">
                      {t('youAreHere')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI explanation panel — shown below the track when a phase is active */}
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
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
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
