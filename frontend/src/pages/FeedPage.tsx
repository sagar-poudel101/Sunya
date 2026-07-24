// Inside src/pages/FeedPage.tsx
import React from 'react';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';

interface FeedPageProps {
  onNavigateToAssistant: () => void;
  onNavigateToTriage: () => void; // Added Prop
}

export const FeedPage: React.FC<FeedPageProps> = ({ onNavigateToAssistant, onNavigateToTriage }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 font-['Manrope']">
      
      {/* 🚀 1-CLICK STEALTH TRIAGE HERO BANNER ON LANDING PAGE */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-md border border-gray-800">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-purple-200 border border-white/10">
              <Lock size={12} className="text-emerald-400" />
              <span>Encrypted Stealth Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-['Sora'] leading-tight">
              Need to Safely Document an Incident or Whistleblow?
            </h2>
            <p className="text-xs text-purple-200/80 leading-relaxed">
              Use our guided 4-step logging form to record facts, voice notes, and witness details, or dispatch an anonymous report to authorities.
            </p>
          </div>

          <button
            onClick={onNavigateToTriage} // 1-Click Redirect
            className="px-6 py-3.5 bg-[#7c6af2] hover:bg-[#6855e0] text-white text-xs font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center space-x-2.5 whitespace-nowrap cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <ShieldAlert size={16} />
            <span>Launch Stealth Triage</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Rest of your Feed Page Content... */}

    </div>
  );
};