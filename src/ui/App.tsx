/**
 * Main App Component with Routing
 * 
 * Handles authentication and routing between screens
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { usePresence } from './hooks/usePresence';
import { AuthScreen } from './components/AuthScreen';
import { GameLayout } from './components/GameLayout';
import { GameRouter } from './routes/GameRouter';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  
  // Automatisches Presence Management
  usePresence();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        color: '#f1f5f9',
      }}>
        <div style={{ fontSize: '18px' }}>Lädt...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          user ? <Navigate to="/" replace /> : <AuthScreen />
        } 
      />

      {/* Protected Routes - require authentication */}
      <Route
        path="/*"
        element={
          user ? (
            <GameLayout>
              <GameRouter />
            </GameLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

export default App;
