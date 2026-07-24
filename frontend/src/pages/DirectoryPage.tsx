import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  Brain, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Copy, 
  Check,
  ExternalLink,
  Globe
} from 'lucide-react';

interface DirectoryItem {
  id: string;
  name: string;
  category: 'lawyer' | 'counsellor';
  role: string;
  organization: string;
  specialties: string[];
  location: string;
  phone: string;
  email: string;
  address: string;
  languages: string[];
  verified: boolean;
  availability: string;
}

export const DirectoryPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'lawyer' | 'counsellor'>('lawyer');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [directoryItems, setDirectoryItems] = useState<DirectoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load directory from backend
  useEffect(() => {
    const fetchDirectory = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:8000/api/directory');
        const data = await response.json();
        if (response.ok && data.success && data.directory) {
          setDirectoryItems(data.directory);
        }
      } catch (err) {
        console.error('Failed to load support directory:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDirectory();
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Get unique list of specialties for currently active category to show in filter pills
  const allSpecialties = Array.from(
    new Set(
      directoryItems
        .filter(item => item.category === activeCategory)
        .flatMap(item => item.specialties)
    )
  );

  const toggleSpecialty = (spec: string) => {
    if (selectedSpecialties.includes(spec)) {
      setSelectedSpecialties(selectedSpecialties.filter(s => s !== spec));
    } else {
      setSelectedSpecialties([...selectedSpecialties, spec]);
    }
  };

  // Filter listings
  const filteredItems = directoryItems.filter(item => {
    // 1. Category Filter
    if (item.category !== activeCategory) return false;

    // 2. Search query filter
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // 3. Specialties filter (if any selected)
    if (selectedSpecialties.length > 0) {
      const hasMatchingSpecialty = selectedSpecialties.some(s => item.specialties.includes(s));
      if (!hasMatchingSpecialty) return false;
    }

    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 font-['Manrope']">
      
      {/* Header */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-black font-['Sora'] text-gray-900 tracking-tight flex items-center justify-center space-x-3">
          <span>⚖️ Verified Rights & Support Directory</span>
        </h1>
        <p className="text-xs text-gray-500 font-semibold leading-relaxed">
          Connect directly with certified lawyers specialized in labor, cyber, and harassment laws, and verified psychiatrists providing trauma recovery and psychosocial care in Nepal.
        </p>
      </div>

      {/* Categories Toggle tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-gray-150 rounded-2xl border border-gray-200 shadow-xs max-w-md w-full">
          <button
            onClick={() => { setActiveCategory('lawyer'); setSelectedSpecialties([]); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold transition-all ${
              activeCategory === 'lawyer'
                ? 'bg-white text-[#7c6af2] shadow-xs border border-gray-100'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Scale size={16} />
            <span>Verified Lawyers</span>
          </button>

          <button
            onClick={() => { setActiveCategory('counsellor'); setSelectedSpecialties([]); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold transition-all ${
              activeCategory === 'counsellor'
                ? 'bg-white text-emerald-600 shadow-xs border border-gray-100'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Brain size={16} />
            <span>Psychiatrists & Counselors</span>
          </button>
        </div>
      </div>

      {/* Search & Specialty Pills */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeCategory === 'lawyer' ? 'lawyers, law firms' : 'psychiatrists, counselors'} by name, location, or issue...`}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#7c6af2]"
          />
        </div>

        {/* Filter Pills */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filter by Specialty</h4>
          <div className="flex flex-wrap gap-1.5">
            {allSpecialties.map(spec => {
              const isSelected = selectedSpecialties.includes(spec);
              return (
                <button
                  key={spec}
                  onClick={() => toggleSpecialty(spec)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    isSelected
                      ? activeCategory === 'lawyer'
                        ? 'bg-[#7c6af2] text-white shadow-xs'
                        : 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {spec}
                </button>
              );
            })}
            {selectedSpecialties.length > 0 && (
              <button 
                onClick={() => setSelectedSpecialties([])}
                className="px-3 py-1.5 text-[10px] font-bold text-red-500 hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Directory Listings Grid */}
      {isLoading ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-8 h-8 border-3 border-[#7c6af2] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 font-bold">Loading support directory registry...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-2">
          <p className="text-base font-extrabold text-gray-800 font-['Sora']">No verified listings found</p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto font-semibold">
            We couldn't find any listings matching your search or filters. Try adjusting your query or filters.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              className={`bg-white rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-gray-300 ${
                activeCategory === 'lawyer' ? 'border-purple-100' : 'border-emerald-100'
              }`}
            >
              {/* Top Details */}
              <div className="space-y-4">
                
                {/* Header Row (Name + Verified Badge) */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-gray-900 font-['Sora'] leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold">{item.role}</p>
                    <p className="text-xs font-semibold text-gray-700">{item.organization}</p>
                  </div>
                  
                  {item.verified && (
                    <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[9px] font-bold border shrink-0 ${
                      activeCategory === 'lawyer' 
                        ? 'bg-purple-50 text-[#7c6af2] border-purple-100' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      <ShieldCheck size={11} />
                      <span>Verified</span>
                    </div>
                  )}
                </div>

                {/* Specialties tags */}
                <div className="flex flex-wrap gap-1">
                  {item.specialties.map(spec => (
                    <span 
                      key={spec} 
                      className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[9px] font-bold text-gray-500"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Info block */}
                <div className="space-y-2 text-xs text-gray-600 font-semibold pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-2.5">
                    <MapPin size={14} className="text-gray-400 shrink-0" />
                    <span>{item.address}</span>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <Globe size={14} className="text-gray-400 shrink-0" />
                    <div className="flex gap-1.5 flex-wrap">
                      {item.languages.map(l => (
                        <span key={l} className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-500 font-bold">{l}</span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Actions Row */}
              <div className="mt-6 pt-4 border-t border-gray-150 flex items-center justify-between gap-2 flex-wrap">
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                  activeCategory === 'lawyer' 
                    ? 'bg-purple-50 text-[#7c6af2]' 
                    : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {item.availability}
                </span>

                <div className="flex items-center space-x-1.5">
                  {/* Copy Phone button */}
                  <button
                    onClick={() => handleCopy(`${item.id}-phone`, item.phone)}
                    title="Copy Phone Number"
                    className="p-2 border border-gray-200 text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-50 transition relative flex items-center justify-center"
                  >
                    {copiedId === `${item.id}-phone` ? <Check size={14} className="text-emerald-500" /> : <Phone size={14} />}
                  </button>

                  {/* Copy Email button */}
                  <button
                    onClick={() => handleCopy(`${item.id}-email`, item.email)}
                    title="Copy Email Address"
                    className="p-2 border border-gray-200 text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-50 transition relative flex items-center justify-center"
                  >
                    {copiedId === `${item.id}-email` ? <Check size={14} className="text-emerald-500" /> : <Mail size={14} />}
                  </button>

                  {/* Direct Contact button */}
                  <a
                    href={`mailto:${item.email}?subject=Confidential Support Request via Antara`}
                    className={`px-3.5 py-2 text-[10px] font-black text-white rounded-xl transition flex items-center space-x-1 ${
                      activeCategory === 'lawyer' 
                        ? 'bg-gray-900 hover:bg-black' 
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <span>Email Now</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
