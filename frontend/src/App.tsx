import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Navbar } from './components/common_com/Navbar';
import { FeedPage } from './pages/FeedPage';
import { AssistantPage } from './pages/AssistantPage';
import { DraftPage } from './pages/DraftPage'; // Import

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'assistant' | 'draft' | 'vault' | 'directory'>('feed');

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <Navbar activeTab={activeTab === 'draft' ? 'assistant' : activeTab} setActiveTab={(tab) => setActiveTab(tab)} />
      
      <main className="pb-16">
        {activeTab === 'feed' && (
          <FeedPage onNavigateToAssistant={() => setActiveTab('assistant')} />
        )}

        {activeTab === 'assistant' && (
          <AssistantPage
            onNavigateToDraft={() => setActiveTab('draft')}
            onNavigateToVault={() => setActiveTab('vault')}
            onNavigateToDirectory={() => setActiveTab('directory')}
          />
        )}

        {activeTab === 'draft' && (
          <DraftPage onBackToAssistant={() => setActiveTab('assistant')} />
        )}

        {activeTab === 'vault' && (
          <div className="max-w-4xl mx-auto mt-12 p-8 bg-white rounded-3xl border border-gray-200 text-center font-['Manrope']">
            <h2 className="text-2xl font-bold font-['Sora']">🔒 Secure Evidence Vault</h2>
            <p className="text-xs text-gray-500 mt-2">Private storage for screenshots, audio logs, and time-stamped incident files.</p>
          </div>
        )}

        {activeTab === 'directory' && (
          <div className="max-w-4xl mx-auto mt-12 p-8 bg-white rounded-3xl border border-gray-200 text-center font-['Manrope']">
            <h2 className="text-2xl font-bold font-['Sora']">⚖️ Verified Lawyers & Counselors Directory</h2>
            <p className="text-xs text-gray-500 mt-2">Map view and direct appointment booking with certified professionals.</p>
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
