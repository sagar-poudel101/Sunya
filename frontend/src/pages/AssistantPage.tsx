// src/pages/AssistantPage.tsx
import React, { useState } from 'react';
import { mockAnalysisResult } from '../services/mockData';
import type { SituationAnalysis } from '../types/triage';
import  { Sparkles, AlertTriangle, CheckCircle2, ShieldCheck, ArrowRight, FileText, Lock, Users, RefreshCw } from 'lucide-react';

type AssistantPageProps = { 
  onNavigateToDraft?: () => void;
  onNavigateToVault?: () => void;
  onNavigateToDirectory?: () => void;
};

export const AssistantPage: React.FC<AssistantPageProps> = ({
  onNavigateToDraft,
  onNavigateToVault,
  onNavigateToDirectory
}) => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SituationAnalysis | null>(null);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsAnalyzing(true);
    // Simulate AI network processing latency
    setTimeout(() => {
      setAnalysis(mockAnalysisResult);
      setIsAnalyzing(false);
    }, 1500);
  };

  const handlePresetExample = () => {
    setInputText("My manager repeatedly makes inappropriate comments during team meetings and explicitly threatened my upcoming promotion if I refuse to have dinner with him alone after work.");
  };

  const handleActionClick = (targetRoute?: string) => {
    if (targetRoute?.includes('draft') && onNavigateToDraft) onNavigateToDraft();
    else if (targetRoute?.includes('vault') && onNavigateToVault) onNavigateToVault();
    else if (targetRoute?.includes('directory') && onNavigateToDirectory) onNavigateToDirectory();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 font-['Manrope']">
      
      {/* Page Heading */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-[#DCD4FF] text-[#7c6af2] px-3 py-1 rounded-full text-xs font-bold mb-3 font-['Sora']">
          <Sparkles size={14} />
          <span>AI Decision & Guidance Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 font-['Sora'] tracking-tight">
          Describe What Happened
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Explain your experience in plain words. No legal jargon required. The AI will analyze rights, assess risk, and suggest concrete next steps.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <form onSubmit={handleAnalyze}>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider font-['Manrope']">
              Situation Description
            </label>
            <button
              type="button"
              onClick={handlePresetExample}
              className="text-xs text-[#7c6af2] hover:underline font-bold"
            >
              ⚡ Load Sample Case Story
            </button>
          </div>

          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type what happened... e.g., 'My manager makes inappropriate comments and threatens my promotion if I don't go out with him.'"
            className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#7c6af2] outline-none text-sm font-['Manrope'] resize-none"
          />

          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-400">
              🔒 Safe & Confidential • Encrypted Entry
            </span>
            <button
              type="submit"
              disabled={isAnalyzing || !inputText.trim()}
              className={`px-6 py-3 rounded-xl font-bold text-sm text-white flex items-center space-x-2 transition shadow-md ${
                isAnalyzing || !inputText.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[#7c6af2] hover:bg-[#6855e0] active:scale-[0.98]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Analyzing Rights & Risk...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Analyze Situation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* AI Analysis Output Section */}
      {analysis && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Risk & Classification Header Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Identified Classification
                </span>
                <h2 className="text-xl font-extrabold text-gray-900 font-['Sora'] mt-1">
                  {analysis.category}
                </h2>
              </div>

              <div className="flex items-center space-x-3">
                {/* Risk Level Badge */}
                <div className="bg-[#FF8A80]/15 border border-[#FF8A80] px-4 py-1.5 rounded-2xl flex items-center space-x-2">
                  <AlertTriangle size={18} className="text-[#FF8A80]" />
                  <span className="text-xs font-extrabold text-[#D32F2F] font-['Sora']">
                    {analysis.riskLevel}
                  </span>
                </div>

                {/* AI Confidence Badge */}
                <div className="bg-[#DCD4FF]/60 border border-[#7c6af2]/30 px-3 py-1.5 rounded-2xl flex items-center space-x-1.5">
                  <ShieldCheck size={16} className="text-[#7c6af2]" />
                  <span className="text-xs font-bold text-[#7c6af2]">
                    {analysis.confidenceScore}% Confidence
                  </span>
                </div>
              </div>
            </div>

            {/* AI Explanation & Transparency */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#FAFAFC] p-4 rounded-2xl border border-gray-200/80">
                <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider font-['Sora'] mb-1">
                  🧠 AI Reasoning & Context
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {analysis.reasoning}
                </p>
              </div>

              <div className="bg-[#FAFAFC] p-4 rounded-2xl border border-gray-200/80">
                <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider font-['Sora'] mb-1">
                  ⚖️ Applicable Legal Overview
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {analysis.legalOverview}
                </p>
              </div>
            </div>
          </div>

          {/* Action Recommendations Grid */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-['Sora'] mb-4 flex items-center space-x-2">
              <span>Recommended Next Steps</span>
              <span className="text-xs bg-[#7c6af2] text-white px-2 py-0.5 rounded-full font-['Manrope']">
                Action Plan
              </span>
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {analysis.recommendedActions.map((action) => (
                <div
                  key={action.id}
                  onClick={() => handleActionClick(action.targetRoute)}
                  className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-[#7c6af2] transition-all shadow-xs hover:shadow-md cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="p-2 rounded-xl bg-[#DCD4FF] text-[#7c6af2] group-hover:bg-[#7c6af2] group-hover:text-white transition">
                        {action.category === 'complaint' && <FileText size={18} />}
                        {action.category === 'evidence' && <Lock size={18} />}
                        {action.category === 'legal' && <ShieldCheck size={18} />}
                        {action.category === 'therapy' && <Users size={18} />}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-[#7c6af2] bg-[#DCD4FF]/50 px-2 py-0.5 rounded-md font-['Sora']">
                        {action.priority} Priority
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-gray-900 font-['Sora'] group-hover:text-[#7c6af2] transition">
                      {action.title}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {action.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#7c6af2]">
                    <span>Proceed with this step</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};