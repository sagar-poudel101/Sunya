import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Navbar } from './components/common_com/Navbar';

import { AssistantPage } from './pages/AssistantPage';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'assistant' | 'vault' | 'directory'>('assistant');

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="pb-16">
        {activeTab === 'assistant' && (
          <AssistantPage
            onNavigateToDraft={() => alert('Heading to Complaint Draft Generator!')}
            onNavigateToVault={() => setActiveTab('vault')}
            onNavigateToDirectory={() => setActiveTab('directory')}
          />
        )}

        {activeTab === 'vault' && (
          <div className="max-w-4xl mx-auto mt-12 p-8 bg-white rounded-3xl border border-gray-200 text-center">
            <h2 className="text-2xl font-bold font-['Sora']">🔒 Secure Evidence Vault</h2>
            <p className="text-xs text-gray-500 mt-2">Next up: Drag-and-drop evidence upload zone with file tagging.</p>
          </div>
        )}

        {activeTab === 'directory' && (
          <div className="max-w-4xl mx-auto mt-12 p-8 bg-white rounded-3xl border border-gray-200 text-center">
            <h2 className="text-2xl font-bold font-['Sora']">⚖️ Lawyers & Therapists Directory</h2>
            <p className="text-xs text-gray-500 mt-2">Next up: Verified support map and provider cards.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}