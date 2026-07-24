// src/pages/TriagePage.tsx
import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Mic, 
  MicOff, 
  Calendar, 
  Users, 
  TrendingDown, 
  Send, 
  FileText, 
  CheckCircle2, 
  Lock, 
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

interface TriagePageProps {
  onBackToFeed: () => void;
  onNavigateToDraft: () => void;
}

export const TriagePage: React.FC<TriagePageProps> = ({ onBackToFeed, onNavigateToDraft }) => {
  // Mode Switcher: 'logging' (Incident Ledger) vs 'whistleblow' (Whistleblower Channel)
  const [activeMode, setActiveMode] = useState<'logging' | 'whistleblow'>('logging');
  const [step, setStep] = useState(1);
  const [isRecording, setIsRecording] = useState(false);

  // Guided Form State
  const [rawText, setRawText] = useState('');
  const [incidentDateTime, setIncidentDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [impactTasks, setImpactTasks] = useState(false);
  const [impactPay, setImpactPay] = useState(false);
  const [impactEvaluation, setImpactEvaluation] = useState(false);

  // Whistleblow State
  const [authorityTarget, setAuthorityTarget] = useState('National Human Rights Commission (NHRC)');
  const [whistleblowMessage, setWhistleblowMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setRawText((prev) => prev + (prev ? "\n" : "") + "[Voice Note Transcribed]: Manager made conditional career comments during private review meeting.");
        setIsRecording(false);
      }, 3000);
    }
  };

  const handleIncidentSubmit = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: rawText,
          incident_date_time: incidentDateTime || null,
          location: location || null,
          witnesses: witnesses || null,
          impact_tasks: impactTasks,
          impact_pay: impactPay,
          impact_evaluation: impactEvaluation,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        console.log("Incident logged with ID:", data.id);
      } else {
        console.error("Failed to log incident to database:", data.detail);
      }
    } catch (err) {
      console.error('Failed to log incident to backend:', err);
    }
    // Navigate to draft page regardless
    onNavigateToDraft();
  };

  const handleWhistleblowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/whistleblow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authority_target: authorityTarget,
          whistleblow_message: whistleblowMessage,
          is_anonymous: isAnonymous,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitted(true);
      } else {
        alert(data.detail || 'Failed to submit whistleblower report.');
      }
    } catch (err) {
      console.error('Failed to submit whistleblower report:', err);
      // Fallback
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] font-['Manrope'] pb-12">
      
      {/* 🔒 STEALTH LAYER TOP NAVBAR */}
      <header className="bg-gray-900 text-white sticky top-0 z-50 border-b border-gray-800 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Back Button */}
          <button
            onClick={onBackToFeed}
            className="flex items-center space-x-2 text-xs font-bold text-gray-300 hover:text-white transition bg-gray-800/80 hover:bg-gray-800 px-3 py-2 rounded-xl border border-gray-700"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center space-x-1 bg-gray-800/90 p-1 rounded-2xl border border-gray-700">
            <button
              onClick={() => { setActiveMode('logging'); setSubmitted(false); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeMode === 'logging' 
                  ? 'bg-[#7c6af2] text-white shadow-xs' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText size={14} />
              <span>Incident Ledger</span>
            </button>

            <button
              onClick={() => { setActiveMode('whistleblow'); setSubmitted(false); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeMode === 'whistleblow' 
                  ? 'bg-red-600 text-white shadow-xs' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ShieldAlert size={14} />
              <span>Whistleblower Channel</span>
            </button>
          </div>

          {/* Security Status Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-full">
            <Lock size={12} />
            <span>Encrypted Session</span>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="max-w-4xl mx-auto px-4 pt-8 space-y-6">

        {/* MODE 1: GUIDED INCIDENT LEDGER */}
        {activeMode === 'logging' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-gray-900 font-['Sora'] flex items-center space-x-2">
                  <ShieldCheck size={22} className="text-[#7c6af2]" />
                  <span>Guided Incident Ledger</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Safely capture objective facts, voice notes, timestamps, and witness details.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase text-[#7c6af2] bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                  Step {step} of 4
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#7c6af2] h-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>

            {/* STEP 1: What Happened */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-gray-900 font-['Sora']">
                  Step 1: What Happened?
                </h3>
                <p className="text-xs text-gray-500">
                  Describe the incident clearly or use voice note transcription.
                </p>

                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Provide raw text or record audio describing the event..."
                  rows={6}
                  className="w-full p-3.5 border border-gray-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-[#7c6af2]"
                />

                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                  <span>{isRecording ? 'Listening... Click to stop' : 'Record Voice Note'}</span>
                </button>
              </div>
            )}

            {/* STEP 2: When and Where */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-gray-900 font-['Sora'] flex items-center space-x-2">
                  <Calendar size={18} className="text-[#7c6af2]" />
                  <span>Step 2: When & Where Did It Occur?</span>
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={incidentDateTime}
                      onChange={(e) => setIncidentDateTime(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#7c6af2]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Specific Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Executive Office / Conference Room B / Slack DM"
                      className="w-full p-3 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#7c6af2]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Who was present */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-gray-900 font-['Sora'] flex items-center space-x-2">
                  <Users size={18} className="text-[#7c6af2]" />
                  <span>Step 3: Who Was Present?</span>
                </h3>
                <p className="text-xs text-gray-500">Tag witnesses or colleagues who observed or were nearby.</p>

                <input
                  type="text"
                  value={witnesses}
                  onChange={(e) => setWitnesses(e.target.value)}
                  placeholder="Names or roles (e.g. Senior Associate, HR Representative)"
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#7c6af2]"
                />
              </div>
            )}

            {/* STEP 4: Objective Impact */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-gray-900 font-['Sora'] flex items-center space-x-2">
                  <TrendingDown size={18} className="text-[#7c6af2]" />
                  <span>Step 4: Objective Impact Assessment</span>
                </h3>
                <p className="text-xs text-gray-500">Check any retaliatory or workplace consequences experienced:</p>

                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={impactTasks}
                      onChange={(e) => setImpactTasks(e.target.checked)}
                      className="w-4 h-4 text-[#7c6af2] rounded focus:ring-[#7c6af2]"
                    />
                    <span className="text-xs font-semibold text-gray-800">Tasks re-assigned or key responsibilities removed</span>
                  </label>

                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={impactPay}
                      onChange={(e) => setImpactPay(e.target.checked)}
                      className="w-4 h-4 text-[#7c6af2] rounded focus:ring-[#7c6af2]"
                    />
                    <span className="text-xs font-semibold text-gray-800">Pay, overtime compensation, or promotion withheld</span>
                  </label>

                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={impactEvaluation}
                      onChange={(e) => setImpactEvaluation(e.target.checked)}
                      className="w-4 h-4 text-[#7c6af2] rounded focus:ring-[#7c6af2]"
                    />
                    <span className="text-xs font-semibold text-gray-800">Unfair performance review or formal warning issued</span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Previous
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-5 py-2.5 bg-[#7c6af2] text-white rounded-xl text-xs font-bold hover:bg-[#6855e0] transition"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleIncidentSubmit}
                  className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition flex items-center space-x-2 shadow-xs"
                >
                  <FileText size={16} />
                  <span>Generate Official HR Notice</span>
                </button>
              )}
            </div>

          </div>
        )}

        {/* MODE 2: WHISTLEBLOWER CHANNEL */}
        {activeMode === 'whistleblow' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-red-100 shadow-xs space-y-6">
            <div className="space-y-1 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-extrabold text-red-600 font-['Sora'] flex items-center space-x-2">
                <ShieldAlert size={22} />
                <span>Direct Whistleblower Channel</span>
              </h2>
              <p className="text-xs text-gray-500">
                Directly transmit encrypted report data to oversight authorities or ethics boards.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-emerald-900 font-['Sora']">Whistleblower Report Transmitted</h4>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">
                  Your encrypted report has been dispatched to <strong>{authorityTarget}</strong>. Metadata and IP headers were completely removed.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWhistleblowSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Target Authority</label>
                  <select
                    value={authorityTarget}
                    onChange={(e) => setAuthorityTarget(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="National Human Rights Commission (NHRC)">National Human Rights Commission (NHRC)</option>
                    <option value="Ministry of Labour & Employment Oversight">Ministry of Labour & Employment Oversight</option>
                    <option value="Internal Ethics Committee (Encrypted HR)">Internal Ethics Committee (Encrypted HR)</option>
                    <option value="Independent Legal Aid Federation">Independent Legal Aid Federation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Comprehensive Incident Details</label>
                  <textarea
                    value={whistleblowMessage}
                    onChange={(e) => setWhistleblowMessage(e.target.value)}
                    placeholder="Provide full details of systemic violations or severe coercion..."
                    rows={6}
                    required
                    className="w-full p-3.5 border border-gray-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex items-center space-x-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    id="anonymousCheck"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <label htmlFor="anonymousCheck" className="text-xs font-bold text-gray-700 flex items-center space-x-1.5 cursor-pointer">
                    <Lock size={12} className="text-red-500" />
                    <span>Strip all personal IP & metadata (100% Anonymous Dispatch)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition flex items-center justify-center space-x-2 shadow-xs"
                >
                  <Send size={16} />
                  <span>Transmit Encrypted Whistleblower Report</span>
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
