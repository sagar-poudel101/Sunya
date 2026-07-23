import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, EyeOff, User as UserIcon, LogOut, Sparkles, FolderLock, Users } from 'lucide-react';

interface NavbarProps {
  activeTab: 'assistant' | 'vault' | 'directory';
  setActiveTab: (tab: 'assistant' | 'vault' | 'directory') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, isAnonymous, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('assistant')}>
          <div className="w-10 h-10 rounded-xl bg-[#DCD4FF] text-[#7c6af2] flex items-center justify-center font-bold shadow-xs">
            <Shield size={24} />
          </div>
          <div>
            <span className="text-xl font-extrabold text-gray-900 font-['Sora'] tracking-tight block leading-none">
              Antara
            </span>
            <span className="text-[10px] text-gray-500 font-['Manrope'] font-semibold">
              AI Safety Engine
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-[#FAFAFC] p-1.5 rounded-2xl border border-gray-200/80">
          <button
            onClick={() => setActiveTab('assistant')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold font-['Manrope'] transition-all ${
              activeTab === 'assistant'
                ? 'bg-[#7c6af2] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Sparkles size={16} />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold font-['Manrope'] transition-all ${
              activeTab === 'vault'
                ? 'bg-[#7c6af2] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FolderLock size={16} />
            <span>Evidence Vault</span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold font-['Manrope'] transition-all ${
              activeTab === 'directory'
                ? 'bg-[#7c6af2] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users size={16} />
            <span>Support Directory</span>
          </button>
        </nav>

        {/* Auth / Anonymous Status Badge */}
        <div className="flex items-center space-x-3">
          {isAnonymous ? (
            <div className="flex items-center space-x-2 bg-[#DCD4FF]/60 border border-[#7c6af2]/30 px-3 py-1.5 rounded-full">
              <EyeOff size={15} className="text-[#7c6af2]" />
              <span className="text-xs font-bold text-gray-800 font-['Sora']">
                Anonymous Mode
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full">
              <UserIcon size={15} className="text-gray-600" />
              <span className="text-xs font-bold text-gray-700 font-['Manrope']">
                {user?.name}
              </span>
            </div>
          )}

          <button
            onClick={logout}
            title="Logout"
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <LogOut size={18} />
          </button>
        </div>

      </div>
    </header>
  );
};