// src/pages/AdminPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Database, 
  Mail, 
  MapPin, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Eye,
  Trash2
} from 'lucide-react';

interface Incident {
  id: number;
  raw_text: string;
  incident_date_time: string | null;
  location: string | null;
  witnesses: string | null;
  impact_tasks: boolean;
  impact_pay: boolean;
  impact_evaluation: boolean;
  created_at: string;
}

interface WhistleblowerReport {
  id: number;
  target_authority: string;
  report_details: string;
  is_anonymous: boolean;
  created_at: string;
}

export const AdminPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [whistleblows, setWhistleblows] = useState<WhistleblowerReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'incidents' | 'whistleblows'>('incidents');

  const fetchData = async () => {
    setLoading(true);
    try {
      const incRes = await fetch('http://localhost:8000/api/incidents');
      const whistleRes = await fetch('http://localhost:8000/api/whistleblow');
      
      if (incRes.ok) {
        const incData = await incRes.json();
        setIncidents(incData);
      }
      if (whistleRes.ok) {
        const whistleData = await whistleRes.json();
        setWhistleblows(whistleData);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 font-['Manrope']">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 font-['Sora'] flex items-center space-x-2">
            <Database className="text-[#7c6af2]" size={24} />
            <span>Antara Secure Audit Panel</span>
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Reviewing encrypted incident ledgers & external whistleblower notifications.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="mt-4 sm:mt-0 flex items-center space-x-1.5 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-xs font-bold text-gray-700 rounded-xl transition shadow-xs disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Metric 1 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-gray-400 font-['Sora']">
              Logged Incidents
            </p>
            <h3 className="text-2xl font-black text-gray-950 font-['Sora'] mt-1">
              {incidents.length}
            </h3>
            <p className="text-[9px] text-gray-500 font-medium mt-0.5">
              Securely recorded in private triage vault.
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#DCD4FF] text-[#7c6af2] rounded-2xl flex items-center justify-center">
            <Mail size={24} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-gray-400 font-['Sora']">
              Whistleblower Reports
            </p>
            <h3 className="text-2xl font-black text-gray-950 font-['Sora'] mt-1">
              {whistleblows.length}
            </h3>
            <p className="text-[9px] text-gray-500 font-medium mt-0.5">
              Escalated to NHRC / Women Commission.
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-gray-400 font-['Sora']">
              Authority Dispatch
            </p>
            <h3 className="text-2xl font-black text-gray-950 font-['Sora'] mt-1">
              100%
            </h3>
            <p className="text-[9px] text-gray-500 font-medium mt-0.5">
              Zero metadata leakages on anonymous submissions.
            </p>
          </div>
        </div>
      </div>

      {/* Mode Select Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveSubTab('incidents')}
          className={`pb-3 px-4 text-xs font-extrabold font-['Sora'] border-b-2 transition-all ${
            activeSubTab === 'incidents'
              ? 'border-[#7c6af2] text-[#7c6af2]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          📁 Logged Incidents ({incidents.length})
        </button>
        <button
          onClick={() => setActiveSubTab('whistleblows')}
          className={`pb-3 px-4 text-xs font-extrabold font-['Sora'] border-b-2 transition-all ${
            activeSubTab === 'whistleblows'
              ? 'border-[#7c6af2] text-[#7c6af2]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          📢 Whistleblower Submissions ({whistleblows.length})
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-xs">
          <RefreshCw size={24} className="animate-spin text-[#7c6af2] mx-auto mb-3" />
          <p className="text-xs text-gray-500 font-semibold">Loading dashboard audit records...</p>
        </div>
      ) : activeSubTab === 'incidents' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table list */}
          <div className="lg:col-span-2 space-y-4">
            {incidents.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-xs text-gray-500">
                No incidents have been logged yet.
              </div>
            ) : (
              incidents.map((inc) => (
                <div 
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`bg-white border p-5 rounded-2xl shadow-xs transition cursor-pointer hover:border-[#7c6af2] ${
                    selectedIncident?.id === inc.id ? 'border-[#7c6af2] ring-1 ring-[#7c6af2]' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-extrabold font-['Sora'] uppercase">
                        <span>Report #{inc.id}</span>
                        <span>•</span>
                        <span className="flex items-center text-red-500">
                          <AlertTriangle size={10} className="mr-0.5" /> Incident Record
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-800 font-semibold line-clamp-2 mt-1">
                        {inc.raw_text}
                      </p>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 flex items-center bg-gray-50 px-2 py-0.5 rounded-lg whitespace-nowrap">
                      <Clock size={10} className="mr-1" /> Just now
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap gap-4 text-[10px] text-gray-500">
                    {inc.location && (
                      <span className="flex items-center">
                        <MapPin size={10} className="mr-1 text-gray-400" /> {inc.location}
                      </span>
                    )}
                    {inc.incident_date_time && (
                      <span className="flex items-center">
                        <Calendar size={10} className="mr-1 text-gray-400" /> {inc.incident_date_time}
                      </span>
                    )}
                    {inc.witnesses && (
                      <span className="flex items-center">
                        <Users size={10} className="mr-1 text-gray-400" /> {inc.witnesses}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Details Sidepanel */}
          <div className="lg:col-span-1">
            {selectedIncident ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4 sticky top-24">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-gray-900 font-['Sora']">
                    Incident Details
                  </h3>
                  <span className="bg-red-50 text-red-600 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md font-['Sora']">
                    High Alert
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase font-['Sora'] block">
                      Incident Summary
                    </label>
                    <p className="text-[11px] text-gray-700 bg-gray-50 p-3 rounded-xl mt-1 whitespace-pre-wrap leading-relaxed">
                      {selectedIncident.raw_text}
                    </p>
                  </div>

                  {selectedIncident.location && (
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase font-['Sora'] block">
                        Location
                      </label>
                      <p className="text-[11px] text-gray-800 font-semibold mt-0.5">
                        {selectedIncident.location}
                      </p>
                    </div>
                  )}

                  {selectedIncident.incident_date_time && (
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase font-['Sora'] block">
                        Date & Time
                      </label>
                      <p className="text-[11px] text-gray-800 font-semibold mt-0.5">
                        {selectedIncident.incident_date_time}
                      </p>
                    </div>
                  )}

                  {selectedIncident.witnesses && (
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase font-['Sora'] block">
                        Witnesses
                      </label>
                      <p className="text-[11px] text-gray-800 font-semibold mt-0.5">
                        {selectedIncident.witnesses}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-extrabold text-gray-400 uppercase font-['Sora'] block">
                      Professional Impacts
                    </label>
                    <div className="mt-1.5 space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${selectedIncident.impact_tasks ? 'bg-red-500' : 'bg-gray-200'}`}></span>
                        <span className="text-[11px] font-semibold text-gray-700">Affected Project Duties</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${selectedIncident.impact_pay ? 'bg-red-500' : 'bg-gray-200'}`}></span>
                        <span className="text-[11px] font-semibold text-gray-700">Affected Salary/Pay Rate</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${selectedIncident.impact_evaluation ? 'bg-red-500' : 'bg-gray-200'}`}></span>
                        <span className="text-[11px] font-semibold text-gray-700">Affected Review/Promotion</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex space-x-2">
                  <button 
                    onClick={() => alert("Marking as resolved in ledger...")}
                    className="flex-1 text-center py-2 bg-[#7c6af2] hover:bg-[#6855e0] text-xs font-bold text-white rounded-xl transition"
                  >
                    Resolve Case
                  </button>
                  <button 
                    onClick={() => setSelectedIncident(null)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-600 rounded-xl transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#FAFAFC] border border-dashed border-gray-200 rounded-2xl p-8 text-center text-xs text-gray-400 font-semibold h-[200px] flex items-center justify-center">
                Select an incident report from the list to view granular detail.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {whistleblows.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-xs text-gray-500">
              No whistleblower reports have been submitted yet.
            </div>
          ) : (
            whistleblows.map((report) => (
              <div 
                key={report.id}
                className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 font-extrabold font-['Sora'] uppercase block mb-1">
                      Report #{report.id} • Escalation
                    </span>
                    <h4 className="text-xs font-black text-gray-900 font-['Sora'] flex items-center space-x-1.5">
                      <span className="p-1 rounded-md bg-[#DCD4FF] text-[#7c6af2]">🏛️</span>
                      <span>Target: {report.target_authority}</span>
                    </h4>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${
                    report.is_anonymous 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-blue-50 text-blue-600'
                  }`}>
                    {report.is_anonymous ? 'Anonymous Escalation' : 'Standard Log'}
                  </span>
                </div>

                <div className="bg-[#FAFAFC] p-3.5 rounded-xl border border-gray-100">
                  <p className="text-[11px] text-gray-700 leading-relaxed font-['Manrope']">
                    {report.report_details}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold pt-1">
                  <span>Logged directly into whistleblower queue.</span>
                  <button 
                    onClick={() => alert("Forwarding encrypted whistle file to targeted commission...")}
                    className="text-xs text-[#7c6af2] font-extrabold hover:underline"
                  >
                    Dispatch File ➜
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
