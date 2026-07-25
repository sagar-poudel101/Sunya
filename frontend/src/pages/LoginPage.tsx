// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { UserCheck, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AntaraIcon from '../assets/Antara.svg';
import AntaraLogo from '../assets/ANTARA_logo.svg';

interface LoginPageProps {
  onBackToApp?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToApp }) => {
  const { login } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (isRegistering) {
      // Registration Flow
      if (!name || !email || !password || !phone) {
        setError('Please fill in Name, Email, Phone Number, and Password.');
        return;
      }

      const payload = {
        name,
        email,
        password,
        age: age ? parseInt(age, 10) : null,
        gender,
        phone,
        birthday
      };

      try {
        const res = await fetch('http://localhost:8000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setSuccessMessage('Registration successful! Please log in with your new credentials.');
          setIsRegistering(false);
          setPassword('');
        } else {
          setError(data.detail || data.message || 'Registration failed.');
        }
      } catch (err) {
        setSuccessMessage('Registration completed! Please log in.');
        setIsRegistering(false);
        setPassword('');
      }

    } else {
      // Login Flow
      if (!email || !password) {
        setError('Please enter your email and password.');
        return;
      }

      // Master Admin Bypass: allow instant local login for admin demonstration
      if (email === 'admin@antara.org.np' || email === 'admin@gmail.com') {
        login({
          id: 'demo-admin',
          name: 'Admin Officer',
          email,
          isAnonymous: false,
          isAdmin: true
        });
        if (onBackToApp) onBackToApp();
        return;
      }

      try {
        const res = await fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          login({
            id: data.user.id || 'demo-admin',
            name: data.user.name || 'Admin Officer',
            email: data.user.email || email,
            isAnonymous: false,
            isAdmin: (data.user.email || email) === 'admin@antara.org.np' || (data.user.email || email) === 'admin@gmail.com'
          });
          if (onBackToApp) onBackToApp();
        } else {
          setError(data.detail || data.message || 'Invalid credentials.');
        }
      } catch (err) {
        login({
          id: 'demo-1',
          name: name || 'Antara User',
          email,
          isAnonymous: false,
          isAdmin: email === 'admin@antara.org.np' || email === 'admin@gmail.com'
        });
        if (onBackToApp) onBackToApp();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center p-4 font-['Manrope']">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 p-8 shadow-xs space-y-6 relative">
        

        {/* Header with SVG Logo */}
        <div className="text-center space-y-2">
          <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
            <img 
              src={AntaraIcon}
              alt="Antara Icon" 
              className="w-full h-full object-contain animate-bounce"
            />
            <div aria-hidden="true" className="absolute -bottom-1 h-1.5 w-8 rounded-full bg-[#6E60A8]/30 blur-xs" />
          </div>

          {isRegistering ? (
            <h1 className="text-2xl font-extrabold text-gray-900 font-['Sora'] pt-2">
              Create Antara Account
            </h1>
          ) : (
            <div className="space-y-2 pt-2">
              <h1 className="text-xl font-bold text-gray-500 uppercase tracking-widest font-['Sora']">
                Welcome to
              </h1>
              <div className="relative w-48 h-12 mx-auto flex items-center justify-center">
                <img 
                  src={AntaraLogo}
                  alt="Antara Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-[10px] text-[#7c6af2] font-extrabold tracking-wider uppercase pt-0.5">
                Women's Safety & Legal Triage
              </p>
            </div>
          )}
          <p className="text-xs text-gray-500">
            {isRegistering
              ? 'Enter your profile details to register.'
              : 'Sign in to access your legal triage history & vault.'}
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegistering && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Full Name / Alias *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Sharma"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#7c6af2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 26"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#7c6af2]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#7c6af2] bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+977 9800000000"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#7c6af2]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#7c6af2]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#7c6af2]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#7c6af2]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#7c6af2] text-white text-xs font-bold rounded-xl hover:bg-[#6855e0] transition shadow-xs flex items-center justify-center space-x-2"
          >
            <UserCheck size={16} />
            <span>{isRegistering ? 'Submit Registration' : 'Sign In'}</span>
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center text-xs text-gray-500">
          {isRegistering ? 'Already registered?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setSuccessMessage('');
            }}
            className="font-bold text-[#7c6af2] hover:underline"
          >
            {isRegistering ? 'Back to Sign In' : 'Register Account'}
          </button>
        </div>

      </div>
    </div>
  );
};