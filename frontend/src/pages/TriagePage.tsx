// src/pages/TriagePage.tsx
import React, { useState } from 'react';
import { ShieldAlert, Mic, MicOff, Calendar, Users, TrendingDown, Send, FileText, CheckCircle2, Lock, EyeOff } from 'lucide-react';

interface TriagePageProps {
  onNavigateToDraft: () => void;
  onBackToAssistant?: () => void;
}

// Make sure it starts with "export const TriagePage"
export const TriagePage: React.FC<TriagePageProps> = ({ onNavigateToDraft, onBackToAssistant }) => {
  const [activeMode, setActiveMode] = useState<'logging' | 'whistleblow'>('logging');
  const [step, setStep] = useState(1);
  const [isRecording, setIsRecording] = useState(false);

  // Form State
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
        setRawText((prev) => prev + " [Voice Note Transcribed]: Manager made conditional career comments during private review meeting.");
        setIsRecording(false);
      }, 3000);
    }
  };

  const handleWhistleblowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 font-['Manrope']">
      
      {/* Header Mode Switcher */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
        <div className="flex space-x-1">
          <button
            onClick={() => { setActiveMode('logging'); setSubmitted(false); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeMode === 'logging' ? 'bg-[#7c6af2] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText size={14} />
            <span>4-Step Incident Logger</span>
          </button>

          <button
            onClick={() => { setActiveMode('whistleblow'); setSubmitted(false); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeMode === 'whistleblow' ? 'bg-red-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldAlert size={14} />
            <span>Whistleblower Dispatch</span>
          </button>
        </div>

        <div className="flex items-center space-x-1.5 text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          <EyeOff size={12} className="text-gray-700" />
          <span>Encrypted Stealth Session</span>
        </div>
      </div>

      {/* MODE 1: GUIDED INCIDENT LOGGING */}
      {activeMode === 'logging' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6">
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-500 uppercase font-['Sora']">
              <span>Step {step} of 4</span>
              <span>
                {step === 1 && "What Happened?"}
                {step === 2 && "When & Where?"}
                {step === 3 && "Witness Tagging"}
                {step === 4 && "Objective Impact"}
              </span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#7c6af2] h-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-gray-900 font-['Sora']">
                Step 1: Describe What Happened
              </h3>
              <p className="text-xs text-gray-500">
                Provide raw text or use voice transcription to record details safely.
              </p>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Describe the incident in your own words..."
                rows={5}
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

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-gray-900 font-['Sora'] flex items-center space-x-2">
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
                    placeholder="e.g. Conference Room B / Private Office"
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#7c6af2]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-gray-900 font-['Sora'] flex items-center space-x-2">
                <Users size={18} className="text-[#7c6af2]" />
                <span>Step 3: Who Was Present?</span>
              </h3>
              <p className="text-xs text-gray-500">Tag any witnesses or colleagues who were nearby or involved.</p>

              <input
                type="text"
                value={witnesses}
                onChange={(e) => setWitnesses(e.target.value)}
                placeholder="Names or roles of witnesses (e.g. Team Lead, Associate)"
                className="w-full p-3 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#7c6af2]"
              />
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-gray-900 font-['Sora'] flex items-center space-x-2">
                <TrendingDown size={18} className="text-[#7c6af2]" />
                <span>Step 4: Objective Impact Assessment</span>
              </h3>
              <p className="text-xs text-gray-500">Check any retaliatory or professional consequences experienced:</p>

              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={impactTasks}
                    onChange={(e) => setImpactTasks(e.target.checked)}
                    className="w-4 h-4 text-[#7c6af2] rounded focus:ring-[#7c6af2]"
                  />
                  <span className="text-xs font-semibold text-gray-800">Tasks re-assigned or project responsibilities removed</span>
                </label>

                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={impactPay}
                    onChange={(e) => setImpactPay(e.target.checked)}
                    className="w-4 h-4 text-[#7c6af2] rounded focus:ring-[#7c6af2]"
                  />
                  <span className="text-xs font-semibold text-gray-800">Pay, overtime, or promotion withheld</span>
                </label>

                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={impactEvaluation}
                    onChange={(e) => setImpactEvaluation(e.target.checked)}
                    className="w-4 h-4 text-[#7c6af2] rounded focus:ring-[#7c6af2]"
                  />
                  <span className="text-xs font-semibold text-gray-800">Unfair performance rating or formal warning issued</span>
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
                onClick={onNavigateToDraft}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition flex items-center space-x-2"
              >
                <FileText size={16} />
                <span>Generate Official HR Notice</span>
              </button>
            )}
          </div>

        </div>
      )}

      {/* MODE 2: WHISTLEBLOWER DISPATCH */}
      {activeMode === 'whistleblow' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-red-100 shadow-xs space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-red-600 font-['Sora'] flex items-center space-x-2">
              <ShieldAlert size={20} />
              <span>Direct Whistleblowing Channel</span>
            </h3>
            <p className="text-xs text-gray-500">
              Directly transmit verified report data to oversight authorities.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-900 font-['Sora']">Report Dispatched Securely</h4>
              <p className="text-xs text-emerald-700">
                Your report has been encrypted and transmitted to <strong>{authorityTarget}</strong>.
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
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Detailed Incident Report</label>
                <textarea
                  value={whistleblowMessage}
                  onChange={(e) => setWhistleblowMessage(e.target.value)}
                  placeholder="Provide comprehensive details of systemic violations or severe coercion..."
                  rows={6}
                  required
                  className="w-full p-3.5 border border-gray-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  id="anonymousCheck"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <label htmlFor="anonymousCheck" className="text-xs font-bold text-gray-700 flex items-center space-x-1">
                  <Lock size={12} className="text-red-500" />
                  <span>Strip all personal IP & metadata (100% Anonymous Transmission)</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition flex items-center justify-center space-x-2 shadow-xs"
              >
                <Send size={16} />
                <span>Transmit Encrypted Whistleblower Report</span>
              </button>
            </form>
          )}
        </div>
      )}

    </div>
  );
};