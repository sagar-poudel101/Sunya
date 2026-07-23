// src/pages
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';
import AntaraLogo from '../assets/Antara.svg';

export const LoginPage: React.FC = () => {
  const { login, loginAsAnonymous } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showBlankPage, setShowBlankPage] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      login(email);
      setIsLaunching(true);
      window.setTimeout(() => {
        setShowBlankPage(true);
      }, 1200);
    }
  };

  if (showBlankPage) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFC' }} />;
  }

  return (
    <>
      <style>{`
        @keyframes logoBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          30% {
            transform: translateY(-5px) scale(1.03);
          }
          60% {
            transform: translateY(2px) scale(0.98);
          }
        }

        @keyframes logoLaunch {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          25% {
            transform: translateY(18px) scale(0.94);
          }
          55% {
            transform: translateY(-18px) scale(1.12);
          }
          100% {
            transform: translateY(-120px) scale(16);
            opacity: 0;
          }
        }
      `}</style>

    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFAFC',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Manrope', sans-serif"
    }}>
      
      {isLaunching && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#FAFAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          pointerEvents: 'none'
        }}>
          <img
            src={AntaraLogo}
            alt="Antara logo"
            style={{
              width: '110px',
              height: '110px',
              animation: 'logoLaunch 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards'
            }}
          />
        </div>
      )}

      <div style={{ maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
        
        {/* Branding Header */}
        <div style={{ textAlign: 'center' }}>
          <img
            src={AntaraLogo}
            alt="Antara logo"
            style={{
              width: '110px',
              height: '110px',
              margin: '0 auto 12px auto',
              display: 'block',
              animation: 'logoBounce 2.8s ease-in-out infinite'
            }}
          />
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', margin: 0, fontFamily: "'Sora', sans-serif" }}>
            Antara
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-2px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '999px',
            backgroundColor: '#7c6af2',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '800'
          }}>1</span>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Sign In
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#111827',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Lock size={16} />
            <span>Sign In to Account</span>
          </button>
        </form>

      </div>
    </div>
    </>
  );
};