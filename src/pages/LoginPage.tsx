// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, ArrowRight } from 'lucide-react';
import AntaraLogo from '../assets/Antara.svg';

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(220,212,255,0.65),transparent_32%),linear-gradient(180deg,#FAFAFC_0%,#F7F4FF_100%)] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img
            src={AntaraLogo}
            alt="Antara logo"
            className="mx-auto mb-4 h-auto w-52.5 object-contain"
          />
          <p className="text-sm font-medium text-[#5B6473]">
            AI-powered support for women’s safety, legal clarity, and next-step guidance.
          </p>
        </div>

        <div className="rounded-[28px] border border-[#DCD4FF] bg-white/90 p-5 shadow-[0_18px_50px_rgba(124,106,242,0.12)] backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-[#1F2937] font-['Sora']">
                Anonymous Mode
              </h3>
              <p className="text-xs text-[#5B6473] mt-1">
                Explore support resources without sharing personal details.
              </p>
            </div>
            <span className="rounded-full bg-[#F7C94A] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#1F2937] font-['Sora']">
              Private
            </span>
          </div>

          <button
            onClick={loginAsAnonymous}
            type="button"
            className="w-full rounded-2xl bg-[#7c6af2] px-4 py-3 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(124,106,242,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#6855e0] active:translate-y-0"
          >
            <span className="flex items-center justify-center gap-2">
              Continue Anonymously
              <ArrowRight size={18} />
            </span>
          </button>
        </div>

        <div className="rounded-[28px] border border-[#DCD4FF] bg-white/90 p-5 shadow-[0_18px_50px_rgba(124,106,242,0.12)] backdrop-blur-sm">
          <div className="relative flex items-center py-1">
            <div className="grow border-t border-[#DCD4FF]"></div>
            <span className="shrink mx-4 text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#7c6af2]">
              Or Sign In to Save History
            </span>
            <div className="grow border-t border-[#DCD4FF]"></div>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#5B6473]">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-2xl border border-[#DCD4FF] bg-[#FAFAFC] px-4 py-3 text-sm text-[#1F2937] outline-none transition duration-150 placeholder:text-[#8A93A3] focus:border-[#7c6af2] focus:ring-4 focus:ring-[#DCD4FF]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#5B6473]">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-[#DCD4FF] bg-[#FAFAFC] px-4 py-3 text-sm text-[#1F2937] outline-none transition duration-150 placeholder:text-[#8A93A3] focus:border-[#7c6af2] focus:ring-4 focus:ring-[#DCD4FF]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#1F2937] px-4 py-3 text-sm font-extrabold text-white transition duration-200 hover:bg-black active:scale-[0.99]"
            >
              <span className="flex items-center justify-center gap-2">
                <Lock size={16} />
                Sign In to Account
              </span>
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-[#DCD4FF] bg-white px-4 py-3 text-center shadow-[0_8px_24px_rgba(124,106,242,0.08)]">
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#5B6473]">
            ⚡ Presentation Quick Test
          </p>
          <button
            type="button"
            onClick={() => login('demo.user@safespace.org')}
            className="text-sm font-extrabold text-[#7c6af2] transition hover:text-[#6855e0]"
          >
            Log in as Demo Registered User
          </button>
        </div>
      </div>
    </div>
  );
};