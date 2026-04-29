import { useState } from 'react';
import { DUMMY_CANDIDATES } from '../constants/electionData';
import type { Screen } from '../App';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface EVMSimulatorProps {
  setCurrentScreen: React.Dispatch<React.SetStateAction<Screen>>;
  sendMessage: (msg: string, isJourney: boolean) => Promise<string>;
  retrieveAndAnswer: (query: string) => Promise<string>;
}

export default function EVMSimulator({ setCurrentScreen, sendMessage, retrieveAndAnswer }: EVMSimulatorProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [showVVPAT, setShowVVPAT] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [aiDebrief, setAiDebrief] = useState<string | null>(null);
  const [loadingDebrief, setLoadingDebrief] = useState(false);

  const handleVote = (id: string) => {
    setSelectedCandidate(id);
    setShowVVPAT(true);

    // VVPAT shows for 3 seconds, then Signature Moment
    setTimeout(() => {
      setShowVVPAT(false);
      setShowSignature(true);
      
      // Fetch AI Debrief in background
      setLoadingDebrief(true);
      retrieveAndAnswer("What happens inside an EVM, is the ballot secret, and what does a VVPAT slip do?")
        .then(res => {
          setAiDebrief(res);
          setLoadingDebrief(false);
        });
        
    }, 3000);
  };

  const votedCandidate = DUMMY_CANDIDATES.find(c => c.id === selectedCandidate);

  return (
    <div className="w-full max-w-lg mx-auto relative z-0">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-navy-blue)]">Electronic Voting Machine (Mock)</h2>
        <p className="text-gray-600">Press the blue button next to your chosen candidate.</p>
      </div>

      {/* EVM Machine Frame */}
      <div className="bg-gray-100 p-6 rounded-3xl border-[12px] border-[var(--color-navy-blue)] shadow-2xl relative">
        {/* VVPAT Window (CSS Animation) */}
        <div className="absolute -right-24 top-10 w-20 h-32 bg-gray-800 border-4 border-gray-600 rounded-lg overflow-hidden flex flex-col shadow-xl">
          <div className="bg-black text-white text-[8px] text-center p-1 border-b border-gray-600">VVPAT</div>
          <div className="flex-1 relative bg-gray-900 overflow-hidden">
            {showVVPAT && (
              <div className="absolute top-0 left-1 right-1 bg-white h-24 flex flex-col items-center justify-center animate-[slideDown_3s_ease-in-out_forwards]">
                <span className="text-2xl">{votedCandidate?.symbol}</span>
                <span className="text-[10px] font-bold text-center mt-1 leading-tight">{votedCandidate?.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {DUMMY_CANDIDATES.map((candidate) => (
            <div key={candidate.id} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-300 shadow-inner">
              <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded flex items-center justify-center text-2xl">
                {candidate.symbol}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">{candidate.name}</h4>
                <p className="text-xs text-gray-500 uppercase font-semibold">{candidate.party}</p>
              </div>
              <button 
                onClick={() => handleVote(candidate.id)}
                disabled={selectedCandidate !== null}
                className={`w-10 h-10 rounded-full border-4 border-gray-300 shadow-md transition-all active:scale-95 ${
                  selectedCandidate === candidate.id 
                    ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                aria-label={`Vote for ${candidate.name}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Signature Moment Overlay */}
      {showSignature && (
        <div className="fixed inset-0 z-50 bg-[var(--color-navy-blue)] flex flex-col items-center justify-center p-6 animate-in fade-in duration-1000">
          <div className="max-w-2xl text-center space-y-8 animate-in slide-in-from-bottom-10 duration-1000 delay-500 fill-mode-both">
            <CheckCircle2 size={80} className="text-[var(--color-deep-green)] mx-auto" />
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Your vote has been counted.
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 font-light leading-relaxed">
              In a real election, this moment is irreversible — and it belongs only to you.
            </p>
            
            <div className="mt-12 p-8 bg-white rounded-3xl text-left shadow-2xl relative">
              <div className="absolute -top-6 left-8 bg-[var(--color-saffron)] text-white p-3 rounded-full shadow-lg">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 ml-12">VoteWise Debrief</h3>
              
              {loadingDebrief ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              ) : (
                <div className="text-gray-700 space-y-4 leading-relaxed whitespace-pre-wrap">
                  {aiDebrief}
                </div>
              )}
            </div>

            <button 
              onClick={() => {
                setShowSignature(false);
                setCurrentScreen('journey');
              }}
              className="mt-12 px-8 py-3 bg-transparent border-2 border-white text-white rounded-full font-bold hover:bg-white hover:text-[var(--color-navy-blue)] transition-colors"
            >
              Back to Journey
            </button>
          </div>
        </div>
      )}

      {/* Global CSS for VVPAT Animation */}
      <style>{`
        @keyframes slideDown {
          0% { transform: translateY(-100%); }
          20% { transform: translateY(0); }
          80% { transform: translateY(0); }
          100% { transform: translateY(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
