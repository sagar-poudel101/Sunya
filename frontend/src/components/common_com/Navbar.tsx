// src/components/common_com/Navbar.tsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User as UserIcon, LogOut, Sparkles, Users, LayoutList, LogIn, Database, ArrowLeft } from 'lucide-react';
import AntaraLogo from '../../assets/Antara.svg';
import AntaraBrandLogo from '../../assets/ANTARA_logo.svg';

interface NavbarProps {
  activeTab: 'feed' | 'assistant' | 'directory' | 'admin';
  setActiveTab: (tab: 'feed' | 'assistant' | 'directory' | 'admin') => void;
  onOpenLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenLogin }) => {
  const { user, logout } = useAuth();

  return (
    <>
      <style>{`
        @keyframes brandBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-5px) scale(1.03); }
          60% { transform: translateY(2px) scale(0.98); }
        }
      `}</style>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 lg:px-8 py-3 font-['Manrope']">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo */}
          <div
            className="cursor-pointer flex items-center space-x-2"
            onClick={() => setActiveTab('feed')}
            style={{ animation: 'brandBounce 2.8s ease-in-out infinite' }}
          >
            <img src={AntaraLogo} alt="Antara Logo" className="w-7 h-7 object-contain" />
            <div>
              <img 
                src={AntaraBrandLogo} 
                alt="Antara" 
                className="h-[15px] w-auto object-contain block mb-0.5" 
              />
              <span className="text-[10px] text-gray-500 font-semibold">
                Women's Safety & Legal Triage
              </span>
            </div>
          </div>

          {/* Clean 3-Item Navigation */}
          <nav className="hidden md:flex items-center space-x-1 bg-[#FAFAFC] p-1.5 rounded-2xl border border-gray-200/80">
            {activeTab !== 'admin' ? (
              <>
                <button
                  onClick={() => setActiveTab('feed')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'assistant'
                      ? 'bg-[#7c6af2] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Sparkles size={15} />
                  <span>AI Assistant</span>
                </button>

                <button
                  onClick={() => setActiveTab('directory')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'directory'
                      ? 'bg-[#7c6af2] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Users size={15} />
                  <span>Support Directory</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveTab('feed')}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
              >
                <ArrowLeft size={14} />
                <span>Return to User App</span>
              </button>
            )}

            {user?.isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-[#7c6af2] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Database size={15} />
                <span>Admin Audit</span>
              </button>
            )}
          </nav>

          {/* User Profile / Auth State */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                  <UserIcon size={14} className="text-[#7c6af2]" />
                  <span className="text-xs font-bold text-gray-700">
                    {user.name || 'Member'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-1.5 bg-[#7c6af2] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#6855e0] transition shadow-xs"
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>
      </header>
    </>
  );
};