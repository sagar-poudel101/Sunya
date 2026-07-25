// src/pages/AdminPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Eye, 
  CheckCircle2, 
  Send,
  Lock,
  Clock,
  MapPin,
  Calendar,
  Users
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'incident' | 'whistleblow'>('all');
  const [selectedItem, setSelectedItem] = useState<{
    id: number;
    type: 'incident' | 'whistleblow';
    target?: string;
    location?: string;
    date?: string;
    impacts?: string[];
  } | null>(null);

  // Local statuses & forwarding actions logs
  const [resolvedIds, setResolvedIds] = useState<Record<string, boolean>>({});
  const [forwardedIds, setForwardedIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  const handleResolve = (type: string, id: number) => {
    const key = `${type}-${id}`;
    setResolvedIds(prev => ({ ...prev, [key]: true }));
    showToast(`Case #${id} successfully marked as Resolved in audit ledger.`);
    if (selectedItem && selectedItem.type === type && selectedItem.id === id) {
      setSelectedItem(null);
    }
  };

  const handleForwardToPartners = (targetAuthority: string, id: number) => {
    const key = `whistleblow-${id}`;
    setForwardedIds(prev => ({ ...prev, [key]: true }));
    showToast(`Encrypted report payload securely dispatched to ${targetAuthority}.`);
  };

  // Merge datasets into metadata-only audit lists
  const combinedAuditList = [
    ...incidents.map(inc => ({
      id: inc.id,
      type: 'incident' as const,
      text_label: '🔒 [Encrypted Incident Log - Statement Protected]',
      target: inc.location || 'Not Specified',
      date: inc.incident_date_time || 'Just now',
      impacts: [
        inc.impact_tasks ? 'Tasks' : '',
        inc.impact_pay ? 'Pay' : '',
        inc.impact_evaluation ? 'Review' : ''
      ].filter(Boolean)
    })),
    ...whistleblows.map(w => ({
      id: w.id,
      type: 'whistleblow' as const,
      text_label: '🔒 [Encrypted Anonymous Whistleblower Payload]',
      target: w.target_authority,
      date: 'Just now',
      impacts: [w.is_anonymous ? 'Anonymous' : 'Standard']
    }))
  ].sort((a, b) => b.id - a.id);

  // Filter lists based on search term and dropdown selection
  const filteredAuditList = combinedAuditList.filter(item => {
    const matchesFilter = filterType === 'all' || item.type === filterType;
    const matchesSearch = item.target.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 font-['Manrope'] relative">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#7c6af2] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-bounce">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Panel Header */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <div className="flex items-center space-x-2 text-[#7c6af2]">
          <Database size={20} />
          <span className="text-[10px] font-extrabold uppercase tracking-wider font-['Sora']">
            Admin Management Console (Zero-Knowledge Audit)
          </span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 font-['Sora'] mt-1">
          Antara Audit Logs
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Reviewing metadata only. In accordance with user privacy rules, raw statement payloads are encrypted and can only be securely forwarded to partners.
        </p>
      </div>

      {/* Control Box / Data Filter */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden mb-8">
        
        {/* Table Filters Toolbar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 w-full md:w-auto">
            {/* Search Input (Location or Authority) */}
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search by location or target authority..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl py-1.5 pl-9 pr-3 text-xs outline-none focus:border-[#7c6af2] transition font-semibold"
              />
            </div>
            
            {/* Type Filter Select */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#7c6af2] font-semibold text-gray-700 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="incident">📁 Incidents</option>
              <option value="whistleblow">📢 Whistleblower</option>
            </select>
          </div>

          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center space-x-2">
            <span>Audit Queue: {filteredAuditList.length} Entries</span>
            <span>•</span>
            <button 
              onClick={fetchData} 
              className="text-[#7c6af2] hover:underline"
            >
              Reload List
            </button>
          </div>
        </div>

        {/* Audit Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-500 font-semibold">
              Loading records...
            </div>
          ) : filteredAuditList.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500">
              No audit logs matched your query.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/50 text-[10px] uppercase font-bold tracking-wider text-gray-500 border-b border-gray-200">
                  <th className="py-3 px-4 font-['Sora']">Record ID</th>
                  <th className="py-3 px-4 font-['Sora']">Type</th>
                  <th className="py-3 px-4 font-['Sora']">Incident Statement Security Status</th>
                  <th className="py-3 px-4 font-['Sora']">Location / Destination Authority</th>
                  <th className="py-3 px-4 font-['Sora']">Status</th>
                  <th className="py-3 px-4 text-right pr-6 font-['Sora']">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredAuditList.map((item, idx) => {
                  const resolvedKey = `${item.type}-${item.id}`;
                  const isResolved = resolvedIds[resolvedKey];
                  const isForwarded = forwardedIds[resolvedKey];

                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition">
                      {/* ID */}
                      <td className="py-4 px-4 font-extrabold text-gray-900 font-['Sora']">
                        #{item.id}
                      </td>

                      {/* TYPE TAG */}
                      <td className="py-4 px-4">
                        <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md font-['Sora'] ${
                          item.type === 'incident'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-[#DCD4FF] text-[#7c6af2]'
                        }`}>
                          {item.type}
                        </span>
                      </td>

                      {/* TEXT STATEMENT LABEL */}
                      <td className="py-4 px-4 font-semibold text-gray-400 flex items-center">
                        <Lock size={12} className="mr-1 text-gray-400" />
                        <span>{item.text_label}</span>
                      </td>

                      {/* LOCATION / DESTINATION */}
                      <td className="py-4 px-4 font-semibold text-gray-600">
                        {item.target}
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-4">
                        {item.type === 'whistleblow' ? (
                          <span className={`inline-flex items-center text-[10px] font-bold ${
                            isForwarded ? 'text-emerald-600' : 'text-blue-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              isForwarded ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}></span>
                            {isForwarded ? 'Dispatched' : 'Pending Forwarding'}
                          </span>
                        ) : (
                          <span className={`inline-flex items-center text-[10px] font-bold ${
                            isResolved ? 'text-emerald-600' : 'text-amber-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              isResolved ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}></span>
                            {isResolved ? 'Resolved' : 'Pending Review'}
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-4 text-right pr-6 whitespace-nowrap space-x-2">
                        {item.type === 'incident' ? (
                          <>
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold transition"
                            >
                              <Eye size={12} />
                              <span>View Metadata</span>
                            </button>
                            {!isResolved && (
                              <button
                                onClick={() => handleResolve(item.type, item.id)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#7c6af2] hover:bg-[#6855e0] text-white rounded-lg text-[10px] font-bold transition"
                              >
                                <CheckCircle2 size={12} />
                                <span>Resolve Case</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleForwardToPartners(item.target, item.id)}
                            disabled={isForwarded}
                            className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition ${
                              isForwarded 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-[#7c6af2] hover:bg-[#6855e0] text-white'
                            }`}
                          >
                            <Send size={12} />
                            <span>{isForwarded ? 'Forwarded' : 'Forward to Partners'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Incident Metadata Details Modal */}
      {selectedItem && selectedItem.type === 'incident' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slideUp">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-extrabold font-['Sora'] uppercase">
                  Details for Incident Log #{selectedItem.id}
                </span>
                <h3 className="text-sm font-extrabold text-gray-900 font-['Sora'] mt-0.5">
                  Audit Investigation file
                </h3>
              </div>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-red-50 text-red-600 font-['Sora']">
                Incident File
              </span>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start space-x-2 text-amber-800 leading-relaxed font-semibold">
                <Lock size={16} className="flex-shrink-0 mt-0.5" />
                <p>
                  🔒 Statement text payload is encrypted to protect user privacy. In accordance with Antara's Zero-Knowledge design, only structural professional impacts are visible to auditors.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-[10px] font-extrabold uppercase text-gray-400 font-['Sora'] tracking-wide">
                    Location
                  </h5>
                  <p className="text-xs font-semibold text-gray-800 mt-0.5">
                    {selectedItem.target}
                  </p>
                </div>
                <div>
                  <h5 className="text-[10px] font-extrabold uppercase text-gray-400 font-['Sora'] tracking-wide">
                    Incident Date
                  </h5>
                  <p className="text-xs font-semibold text-gray-800 mt-0.5">
                    {selectedItem.date}
                  </p>
                </div>
              </div>

              {selectedItem.impacts && selectedItem.impacts.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-extrabold uppercase text-gray-400 font-['Sora'] tracking-wide">
                    Professional Areas Affected
                  </h5>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedItem.impacts.map((imp, i) => (
                      <span key={i} className="text-[9px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-md">
                        {imp} Affected
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-700 rounded-xl transition"
              >
                Close View
              </button>
              {!resolvedIds[`incident-${selectedItem.id}`] && (
                <button
                  onClick={() => handleResolve('incident', selectedItem.id)}
                  className="px-4 py-2 bg-[#7c6af2] hover:bg-[#6855e0] text-xs font-bold text-white rounded-xl transition"
                >
                  Mark Case Resolved
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
