// src/App.tsx
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Navbar } from './components/common_com/Navbar';
import { FeedPage } from './pages/FeedPage';
import { AssistantPage } from './pages/AssistantPage';
import { DraftPage } from './pages/DraftPage';
import { TriagePage } from './pages/TriagePage';
import { DirectoryPage } from './pages/DirectoryPage';
import { AdminPage } from './pages/AdminPage';

const DashboardContent: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'feed' | 'assistant' | 'directory' | 'triage' | 'draft' | 'admin'>('feed');
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
          <DirectoryPage />
        )}

        {/* Admin Dashboard Audit Panel */}
        {activeTab === 'admin' && (
          <AdminPage />
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
