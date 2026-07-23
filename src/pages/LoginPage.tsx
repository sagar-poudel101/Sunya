import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, ArrowRight, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginAsAnonymous } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      login(email);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        
        {/* Branding Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#DCD4FF] text-[#7c6af2] mb-4 shadow-sm">
            <Shield size={36} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-['Sora']">
            SafeSpace AI
          </h1>
          <p className="mt-2 text-sm text-gray-600 font-['Manrope']">
            Empowering women with legal, psychological & AI-guided support.
          </p>
        </div>

        {/* Anonymous Mode Highlight Box */}
        <div className="bg-gradient-to-r from-[#DCD4FF]/60 to-[#7c6af2]/10 border border-[#7c6af2]/20 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-[#7c6af2] text-white rounded-xl mt-0.5">
              <EyeOff size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900 font-['Sora']">
                Need Immediate & Confidential Help?
              </h3>
              <p className="text-xs text-gray-600 mt-1 font-['Manrope']">
                Explore legal rights, analyze your situation, and draft complaints without sharing personal details.
              </p>
              <button
                onClick={loginAsAnonymous}
                type="button"
                className="mt-3 w-full py-2.5 px-4 bg-[#7c6af2] hover:bg-[#6855e0] text-white font-semibold text-sm rounded-xl transition duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg font-['Manrope']"
              >
                <span>Continue Anonymously</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 uppercase tracking-wider font-['Manrope']">
            Or Sign In to Save History
          </span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Standard Login Form */}
        <form className="mt-2 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 font-['Manrope']">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7c6af2] outline-none font-['Manrope'] bg-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 font-['Manrope']">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7c6af2] outline-none font-['Manrope'] bg-white text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white font-semibold text-sm rounded-xl transition duration-200 flex items-center justify-center space-x-2 font-['Manrope'] shadow-sm"
          >
            <Lock size={16} />
            <span>Sign In to Account</span>
          </button>
        </form>

        {/* Demo Quick Button for Hackathon Presentation */}
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
          <p className="text-xs text-gray-500 font-medium mb-1 font-['Manrope']">
            ⚡ Hackathon Demo Quick Test
          </p>
          <button
            onClick={() => login('demo.user@safespace.org')}
            className="text-xs text-[#7c6af2] hover:underline font-semibold font-['Manrope']"
          >
            Log in as Demo Registered User
          </button>
        </div>

      </div>
    </div>
  );
};