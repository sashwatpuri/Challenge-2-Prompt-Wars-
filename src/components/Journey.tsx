/**
 * Journey.tsx — Personalised Voting Roadmap
 *
 * Displays the user's customised step-by-step journey toward casting their vote.
 * Each step can be:
 *  - Toggled complete/incomplete by clicking the circle icon
 *  - Expanded to reveal an AI-generated explanation (fetched on first expand)
 *
 * Also provides quick-action buttons to navigate to the Form Wizard,
 * Booth Locator, or EVM Simulator, and a WhatsApp share button.
 */

import { useState } from 'react';
import type { JourneyStep, Screen } from '../App';
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp,
  Sparkles, ArrowRight, FileText, MapPin, Share2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ─── Props ────────────────────────────────────────────────────────────────────

interface JourneyProps {
  journeySteps: JourneyStep[];
  setJourneySteps: React.Dispatch<React.SetStateAction<JourneyStep[]>>;
  setCurrentScreen: React.Dispatch<React.SetStateAction<Screen>>;
  retrieveAndAnswer: (query: string) => Promise<string>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Journey({
  journeySteps,
  setJourneySteps,
  setCurrentScreen,
  retrieveAndAnswer,
}: JourneyProps) {
  const { t } = useLanguage();

  // Tracks which step's explanation panel is open (null = all collapsed)
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Cache of AI-generated explanations keyed by step ID (avoids re-fetching)
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  // The step ID currently being loaded (shows a loading state in that card)
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);

  // ─── Handlers ───────────────────────────────────────────────────────────

  /** Toggles the completed state of a journey step. */
  const toggleStep = (id: string) => {
    setJourneySteps(steps =>
      steps.map(step => step.id === id ? { ...step, completed: !step.completed } : step)
    );
  };

  /**
   * Expands or collapses the explanation panel for a step.
   * Fetches the AI explanation on first expand and caches the result.
   */
  const handleExplain = async (step: JourneyStep) => {
    // Collapse if already open
    if (expandedStep === step.id) {
      setExpandedStep(null);
      return;
    }

    setExpandedStep(step.id);

    // Only fetch if not already cached
    if (!explanations[step.id]) {
      setLoadingExplanation(step.id);
      const explanation = await retrieveAndAnswer(
        `Explain the step "${step.title}" - "${step.description}"`
      );
      setExplanations(prev => ({ ...prev, [step.id]: explanation }));
      setLoadingExplanation(null);
    }
  };

  /** Shares the current journey progress via WhatsApp. */
  const handleShare = () => {
    const text =
      `Here is my voting roadmap from VoteWise:\n` +
      journeySteps.map((s, i) => `${i + 1}. ${s.title} ${s.completed ? '✅' : '⏳'}`).join('\n');
    window.open(`whatsapp://send?text=${encodeURIComponent(text)}`);
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Roadmap card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-[var(--color-navy-blue)] mb-2">
          {t('votingJourneyTitle')}
        </h2>
        <p className="text-gray-600 mb-6">{t('votingJourneySubtitle')}</p>

        {/* Step list */}
        <div className="space-y-4">
          {journeySteps.map((step, index) => (
            <div
              key={step.id}
              className={`border rounded-xl transition-all ${
                step.completed ? 'border-[var(--color-deep-green)] bg-green-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="p-4 flex items-start gap-4">
                {/* Completion toggle */}
                <button
                  onClick={() => toggleStep(step.id)}
                  className={`mt-1 flex-shrink-0 transition-colors ${
                    step.completed ? 'text-[var(--color-deep-green)]' : 'text-gray-300 hover:text-gray-400'
                  }`}
                  aria-label={step.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {step.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>

                <div className="flex-1">
                  {/* Step title */}
                  <h3 className={`font-semibold text-lg ${
                    step.completed ? 'text-[var(--color-deep-green)] line-through opacity-70' : 'text-gray-900'
                  }`}>
                    {t('stepPrefix')} {index + 1}: {step.title}
                  </h3>

                  {/* Step description */}
                  <p className={`text-sm mt-1 ${step.completed ? 'text-green-700 opacity-70' : 'text-gray-600'}`}>
                    {step.description}
                  </p>

                  {/* AI Explain toggle */}
                  <button
                    onClick={() => handleExplain(step)}
                    className="mt-3 flex items-center gap-1 text-sm font-medium text-[var(--color-saffron)] hover:text-orange-600 transition-colors"
                  >
                    <Sparkles size={16} />
                    {expandedStep === step.id ? t('hideExplain') : t('explainCta')}
                    {expandedStep === step.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {/* Explanation panel */}
                  {expandedStep === step.id && (
                    <div className="mt-3 p-4 bg-orange-50 rounded-lg text-gray-800 text-sm border border-orange-100 animate-in fade-in slide-in-from-top-2">
                      {loadingExplanation === step.id ? (
                        <div className="flex items-center gap-2 text-gray-500">
                          <span className="animate-bounce">.</span>
                          <span className="animate-bounce delay-100">.</span>
                          <span className="animate-bounce delay-200">.</span>
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

      {/* Quick-action buttons */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setCurrentScreen('formWizard')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-[var(--color-india-blue)] border-2 border-[var(--color-india-blue)] rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-sm"
        >
          <FileText size={18} /> {t('journeyPrepareForm6')}
        </button>

        <button
          onClick={() => setCurrentScreen('boothLocator')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-[var(--color-saffron)] border-2 border-[var(--color-saffron)] rounded-xl font-bold hover:bg-orange-50 transition-colors shadow-sm"
        >
          <MapPin size={18} /> {t('journeyFindBooth')}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-[var(--color-india-green)] border-2 border-[var(--color-india-green)] rounded-xl font-bold hover:bg-green-50 transition-colors shadow-sm"
        >
          <Share2 size={18} /> {t('journeyShareRoadmap')}
        </button>
      </div>

      {/* Proceed to EVM Simulator */}
      <div className="flex justify-center mt-6">
        <button
          onClick={() => setCurrentScreen('evm')}
          className="flex items-center gap-2 px-8 py-4 bg-[var(--color-navy-blue)] text-white rounded-full font-bold shadow-lg hover:bg-blue-900 transition-colors transform hover:scale-105"
        >
          {t('proceedEvm')} <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
