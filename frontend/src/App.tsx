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
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'feed' | 'assistant' | 'directory' | 'triage' | 'draft'>('feed');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Keep Navbar highlighted on 'assistant' when inside sub-routes like draft or triage
  const navTab = (activeTab === 'draft' || activeTab === 'triage') ? 'assistant' : activeTab;

  // Render Login Page when requested or if user clicks Sign In
  if (showLoginModal) {
    return (
      <LoginPage 
        onBackToApp={() => setShowLoginModal(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <Navbar 
        activeTab={navTab} 
        setActiveTab={(tab) => setActiveTab(tab)} 
        onOpenLogin={() => setShowLoginModal(true)}
      />
      
      <main className="pb-16">
        {/* Landing Page (Community Feed + 1-Click Triage Banner) */}
        {activeTab === 'feed' && (
          <FeedPage 
            onNavigateToAssistant={() => setActiveTab('assistant')} 
            onNavigateToTriage={() => setActiveTab('triage')} 
          />
        )}

        {/* AI Legal Assistant */}
        {activeTab === 'assistant' && (
          <AssistantPage
            onNavigateToDraft={() => setActiveTab('draft')}
            onNavigateToVault={() => setActiveTab('triage')}
            onNavigateToDirectory={() => setActiveTab('directory')}
          />
        )}

        {/* 4-Step Stealth Triage Engine & Whistleblowing */}
        {activeTab === 'triage' && (
          <TriagePage 
            onBackToFeed={() => setActiveTab('feed')}
            onNavigateToDraft={() => setActiveTab('draft')} 
          />
        )}

        {/* HR Complaint Generator */}
        {activeTab === 'draft' && (
          <DraftPage onBackToAssistant={() => setActiveTab('assistant')} />
        )}

        {/* Verified Support Directory */}
        {activeTab === 'directory' && (
          <div className="max-w-4xl mx-auto mt-12 p-8 bg-white rounded-3xl border border-gray-200 text-center font-['Manrope']">
            <h2 className="text-2xl font-bold font-['Sora'] font-extrabold text-gray-900">
              ⚖️ Verified Lawyers & Counselors Directory
            </h2>
            <p className="text-xs text-gray-500 mt-2 font-semibold">
              Connect with certified legal experts and emergency rights advocates.
            </p>
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