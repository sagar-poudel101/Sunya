// src/components/common/Navbar.tsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { EyeOff, User as UserIcon, LogOut, Sparkles, FolderLock, Users, LayoutList } from 'lucide-react';

interface NavbarProps {
  activeTab: 'feed' | 'assistant' | 'vault' | 'directory';
  setActiveTab: (tab: 'feed' | 'assistant' | 'vault' | 'directory') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, isAnonymous, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 lg:px-8 py-3 font-['Manrope']">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        <div className="cursor-pointer" onClick={() => setActiveTab('feed')}>
          <div>
            <span className="text-xl font-extrabold text-gray-900 font-['Sora'] tracking-tight block leading-none">
              Antara
            </span>
            <span className="text-[10px] text-gray-500 font-semibold">
              Women's Safety & AI Guidance
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-[#FAFAFC] p-1.5 rounded-2xl border border-gray-200/80">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'feed'
                ? 'bg-[#7c6af2] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <LayoutList size={15} />
            <span>Community Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('assistant')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'assistant'
                ? 'bg-[#7c6af2] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Sparkles size={15} />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'vault'
                ? 'bg-[#7c6af2] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FolderLock size={15} />
            <span>Evidence Vault</span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'directory'
                ? 'bg-[#7c6af2] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users size={15} />
            <span>Support Directory</span>
          </button>
        </nav>

        {/* Auth / Anonymous Status Badge */}
        <div className="flex items-center space-x-3">
          {isAnonymous ? (
            <div className="flex items-center space-x-2 bg-[#DCD4FF]/60 border border-[#7c6af2]/30 px-3 py-1.5 rounded-full">
              <EyeOff size={14} className="text-[#7c6af2]" />
              <span className="text-xs font-bold text-gray-800 font-['Sora']">
                Anonymous Mode
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full">
              <UserIcon size={14} className="text-gray-600" />
              <span className="text-xs font-bold text-gray-700">
                {user?.name}
              </span>
            </div>
          )}

          <button
            onClick={logout}
            title="Logout"
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <LogOut size={16} />
          </button>
        </div>

      </div>
    </header>
  );
};
