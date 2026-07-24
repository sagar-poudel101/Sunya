import React, { useState } from 'react';
import { FileText, Copy, Check, ArrowLeft, ShieldCheck, Sparkles, Printer } from 'lucide-react';

interface DraftPageProps {
  onBackToAssistant: () => void;
}

export const DraftPage: React.FC<DraftPageProps> = ({ onBackToAssistant }) => {
  const [copied, setCopied] = useState(false);
  const [recipient, setRecipient] = useState('Human Resources Department / Internal Complaints Committee');
  const [companyName, setCompanyName] = useState('Acme Corporation');
  const [incidentDate, setIncidentDate] = useState('2026-07-20');
  
  const draftContent = `FORMAL COMPLAINT REGARDING WORKPLACE HARASSMENT & UNFAIR TREATMENT

To: ${recipient}
Company/Organization: ${companyName}
Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

SUBJECT: Formal Notice of Workplace Harassment and Coercive Conduct

Dear Members of the Committee / HR Department,

I am writing to formally log an official complaint regarding repeated conduct that violates company policy and applicable employment anti-harassment regulations.

INCIDENT DETAILS:
- Approximate Date of Incident(s): ${incidentDate}
- Description of Conduct: Conditional career advancement threats linked to personal demands (Quid Pro Quo Coercion) by immediate management.

LEGAL & POLICY BASIS:
Under standard employment protections, making professional evaluations, promotions, or compensation contingent upon personal favors constitutes illegal harassment and creates a hostile working environment.

REQUESTED ACTION:
1. Initiate a confidential investigation into this matter as prescribed by company policy.
2. Ensure immediate protective measures to prevent retaliation against my current standing or role.
3. Provide written confirmation of receipt of this formal complaint and outlined next steps within 3 business days.

Sincerely,
[Confidential / Complainant]
Generated via Antara Legal AI Engine`;

  const handleCopy = () => {
    navigator.clipboard.writeText(draftContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 font-['Manrope']">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToAssistant}
          className="flex items-center space-x-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-xs transition"
        >
          <ArrowLeft size={16} />
          <span>Back to AI Assistant</span>
        </button>

        <div className="flex items-center space-x-2 bg-[#DCD4FF]/60 px-3 py-1 rounded-full border border-[#7c6af2]/30">
          <Sparkles size={14} className="text-[#7c6af2]" />
          <span className="text-xs font-bold text-[#7c6af2] font-['Sora']">
            AI Document Generator
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid md:grid-cols-12 gap-6">
        
        {/* Left Inputs Controls */}
        <div className="md:col-span-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-gray-900 font-['Sora'] flex items-center space-x-2">
            <FileText size={16} className="text-[#7c6af2]" />
            <span>Customize Notice</span>
          </h3>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Recipient Body
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#7c6af2] outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#7c6af2] outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Incident Date
            </label>
            <input
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#7c6af2] outline-none"
            />
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-2">
            <button
              onClick={handleCopy}
              className="w-full py-2.5 bg-[#7c6af2] text-white font-bold text-xs rounded-xl hover:bg-[#6855e0] transition flex items-center justify-center space-x-2 shadow-xs"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Draft Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="w-full py-2.5 bg-gray-900 text-white font-bold text-xs rounded-xl hover:bg-black transition flex items-center justify-center space-x-2 shadow-xs"
            >
              <Printer size={16} />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

        {/* Right Live Document Preview */}
        <div className="md:col-span-8 bg-white p-8 rounded-3xl border border-gray-200 shadow-xs relative font-mono text-xs leading-relaxed text-gray-800 space-y-4">
          <div className="absolute top-4 right-4 flex items-center space-x-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <ShieldCheck size={14} />
            <span>Legally Articulated Schema</span>
          </div>

          <pre className="whitespace-pre-wrap font-mono text-xs text-gray-800 bg-[#FAFAFC] p-6 rounded-2xl border border-gray-100">
            {draftContent}
          </pre>
        </div>

      </div>

    </div>
  );
};
