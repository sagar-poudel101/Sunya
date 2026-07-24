// src/App.tsx
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Navbar } from './components/common_com/Navbar';
import { FeedPage } from './pages/FeedPage';
import { AssistantPage } from './pages/AssistantPage';
import { DraftPage } from './pages/DraftPage';
import { TriagePage } from './pages/TriagePage';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'assistant' | 'directory' | 'triage' | 'draft'>('feed');

  // Compute active navbar tab
  const navTab = (activeTab === 'draft' || activeTab === 'triage') ? 'assistant' : activeTab;

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <Navbar 
        activeTab={navTab} 
        setActiveTab={(tab) => setActiveTab(tab)} 
      />
      
      <main className="pb-16">
        {/* Landing / Community Feed Page */}
        {activeTab === 'feed' && (
          <FeedPage 
            onNavigateToAssistant={() => setActiveTab('assistant')} 
            onNavigateToTriage={() => setActiveTab('triage')} // 1-Click Trigger
          />
        )}

        {/* AI Assistant Page */}
        {activeTab === 'assistant' && (
          <AssistantPage
            onNavigateToDraft={() => setActiveTab('draft')}
            onNavigateToVault={() => setActiveTab('triage')}
            onNavigateToDirectory={() => setActiveTab('directory')}
          />
        )}

        {/* 1-Click Rendered Triage & Safety Engine */}
        {activeTab === 'triage' && (
          <TriagePage 
            onNavigateToDraft={() => setActiveTab('draft')} 
          />
        )}

        {/* Complaint Draft Generator */}
        {activeTab === 'draft' && (
          <DraftPage onBackToAssistant={() => setActiveTab('assistant')} />
        )}

        {/* Directory Page */}
        {activeTab === 'directory' && (
          <div className="max-w-4xl mx-auto mt-12 p-8 bg-white rounded-3xl border border-gray-200 text-center font-['Manrope']">
            <h2 className="text-2xl font-bold font-['Sora'] font-extrabold">⚖️ Verified Support Directory</h2>
            <p className="text-xs text-gray-500 mt-2 font-semibold">Connect with verified legal counselors and rights advocates.</p>
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