// src/App.tsx
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';

// Main App Wrapper to check auth state
const MainContent: React.FC = () => {
  const { user, isAnonymous, logout } = useAuth();

  // If not logged in & not anonymous, show Login Page
  if (!user) {
    return <LoginPage />;
  }

  // Once logged in or entered anonymously, show a temporary success screen
  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <h2 className="text-2xl font-bold font-['Sora'] text-gray-900 mb-2">
          Welcome to SafeSpace AI!
        </h2>
        
        <div className="my-4 p-3 rounded-xl bg-[#DCD4FF]/40 text-[#7c6af2] font-semibold text-sm font-['Manrope']">
          {isAnonymous ? '🕶️ Mode: Anonymous Mode Active' : `👤 Logged in as: ${user.name}`}
        </div>

        <p className="text-sm text-gray-600 mb-6 font-['Manrope']">
          Next, we will build the top **Navbar** and the **AI Assistant Page** where users describe their situation.
        </p>

        <button
          onClick={logout}
          className="w-full py-2.5 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium text-sm transition font-['Manrope']"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}