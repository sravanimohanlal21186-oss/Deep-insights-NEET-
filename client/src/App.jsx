import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Questions from './pages/Questions';
import ExamTaker from './components/ExamTaker';
import OfflineIndicator from './components/OfflineIndicator';
import { useServiceWorker } from './hooks/useOffline';
import './App.css';

// Configure React Query for optimal performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      retry: 3,
    },
  },
});

function AppContent() {
  const { isOnline } = useServiceWorker();

  return (
    <div className="app-container">
      <OfflineIndicator />
      
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">📚</span>
            Deep Insights NEET
          </h1>
          <p className="app-subtitle">Advanced Exam Preparation Platform</p>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage isOnline={isOnline} />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/exam/:examId" element={<ExamTaker />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>© 2026 Deep Insights NEET | Helping you ace NEET exams</p>
      </footer>
    </div>
  );
}

function HomePage({ isOnline }) {
  return (
    <div className="home-page">
      <div className="hero">
        <h2>🎯 Master NEET with AI-Powered Insights</h2>
        <p>Prepare smarter, score higher</p>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">📱</div>
          <h3>Works Offline</h3>
          <p>Practice anytime, anywhere. No internet needed!</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Lightning Fast</h3>
          <p>Instant load times with smart caching</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Detailed Analytics</h3>
          <p>Track your progress with comprehensive stats</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🎓</div>
          <h3>Expert Content</h3>
          <p>Curated questions from top NEET educators</p>
        </div>
      </div>

      <div className="cta-section">
        <button className="cta-button primary" onClick={() => window.location.href = '/questions'}>
          🚀 Start Practicing
        </button>
        <button className="cta-button secondary" onClick={() => window.location.href = '/exams'}>
          📝 Take a Mock Exam
        </button>
      </div>

      {!isOnline && (
        <div className="offline-notice">
          <span>🔴 You're offline</span>
          <span>Your progress will sync when you're back online</span>
        </div>
      )}
    </div>
  );
}

function NotFound() {
  return (
    <div className="not-found">
      <h2>404 - Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <button onClick={() => window.location.href = '/'}>← Go Home</button>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
