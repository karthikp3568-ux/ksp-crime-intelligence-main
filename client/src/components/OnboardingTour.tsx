import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Shield, MapPin, Network, DollarSign, FileText, CheckCircle2 } from 'lucide-react';

interface OnboardingStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  highlights: string[];
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to KSP Crime Intelligence System",
    subtitle: "Pillar 1: Multi-Role Access Control & RLS",
    description: "Designed for Karnataka State Police with role-based view isolation for Investigators, Analysts, Supervisors, and Policymakers.",
    icon: <Shield className="w-8 h-8 text-blue-400" />,
    highlights: [
      "Role-Based Row Level Security (RLS) enforcement",
      "Tamper-evident audit logging for all queries",
      "District and station level data scoping"
    ]
  },
  {
    title: "Vernacular Multimodal RAG Assistant",
    subtitle: "Pillar 2: Zia LLM & Vernacular AI",
    description: "Query crime records, offender histories, and trend predictions in English or Kannada (ಕನ್ನಡ) using voice or text.",
    icon: <Sparkles className="w-8 h-8 text-amber-400" />,
    highlights: [
      "Bidirectional English <-> Kannada translation",
      "Web Voice API & Zia Speech STT dictation",
      "CCTNS-indexed knowledge grounding"
    ]
  },
  {
    title: "Offender Network & Hotspot Analytics",
    subtitle: "Pillar 5 & 8: Spatial & Link Forensics",
    description: "Visualize crime hotspots across Karnataka districts and uncover hidden multi-district offender syndicate networks.",
    icon: <Network className="w-8 h-8 text-emerald-400" />,
    highlights: [
      "Interactive Leaflet hotspot density maps",
      "Vis-Network graph showing co-accused gang links",
      "Real-time emergency patrol unit dispatching"
    ]
  },
  {
    title: "Financial Forensics & CDR Tracker",
    subtitle: "Pillar 4 & 5: Money & Cell Tracking",
    description: "Track money laundering trails across shell companies, hawala agents, and crypto wallets alongside cellular CDR timelines.",
    icon: <DollarSign className="w-8 h-8 text-purple-400" />,
    highlights: [
      "Suspicious transaction flow diagrams",
      "Cell tower location timeline mapping",
      "Automated financial risk scoring"
    ]
  },
  {
    title: "Warrant Desk & Executive Reports",
    subtitle: "Pillar 9 & 10: Inter-Agency Operations",
    description: "Manage court warrants, track case milestones, and generate official PDF executive briefs using SmartBrowz.",
    icon: <FileText className="w-8 h-8 text-sky-400" />,
    highlights: [
      "Bulk warrant status updates & court tracking",
      "Single-click SmartBrowz PDF report export",
      "Collaborative shared analyst workspace"
    ]
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-slate-700/60 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl">
              {step.icon}
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">{step.subtitle}</span>
              <h3 className="text-lg font-bold text-white leading-tight">{step.title}</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Description Body */}
        <div className="space-y-4 mb-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            {step.description}
          </p>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Key Highlights</h4>
            {step.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-200">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress & Navigation Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="flex items-center gap-1.5">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  index === currentStep ? 'w-6 bg-blue-500' : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} /> Previous
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-lg shadow-blue-600/20"
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                Get Started <CheckCircle2 size={14} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
