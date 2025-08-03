import './App.css';
import HomePage from './components/HomePage';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import ExpediteurDetail from './components/dashboard/ExpediteurDetail';
import BonLivraisonColis from './components/dashboard/BonLivraisonColis';
import LivreurDeliveryMissions from './components/dashboard/LivreurDeliveryMissions';
import LivreurDashboard from './components/dashboard/LivreurDashboard';
import ExpediteurDashboardTest from './components/dashboard/ExpediteurDashboardTest';
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import i18n from './i18n';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  useEffect(() => {
    console.log('App current language:', i18n.language);
    // Force French
    i18n.changeLanguage('fr');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </QueryClientProvider>
  );
}

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    // Always show React root and hide static content
    const root = document.getElementById('root');
    if (root) {
      root.style.display = 'block';
    }
    
    const staticContent = document.getElementById('static-content');
    if (staticContent) {
      staticContent.style.display = 'none';
    }
  }, [location]);

  return (
    <Routes>
      {/* Make login the default landing page */}
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/expediteur/:id" element={
        <ProtectedRoute>
          <ExpediteurDetail />
        </ProtectedRoute>
      } />
      <Route path="/bon-livraison/:id" element={
        <ProtectedRoute>
          <BonLivraisonColis />
        </ProtectedRoute>
      } />
      <Route path="/livreur-delivery-missions" element={
        <ProtectedRoute>
          <LivreurDeliveryMissions />
        </ProtectedRoute>
      } />
      <Route path="/livreur-dashboard" element={
        <ProtectedRoute>
          <LivreurDashboard />
        </ProtectedRoute>
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/test" element={<div><h1>Test Route Working!</h1></div>} />
      <Route path="/test-expediteur" element={<ExpediteurDashboardTest />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
