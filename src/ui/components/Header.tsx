/**
 * Header Component with User Info and Logout
 */

import React from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) return null;

  return (
    <header style={{
      backgroundColor: '#1e293b',
      padding: '16px 24px',
      borderBottom: '1px solid #334155',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <h2 style={{
          color: '#3b82f6',
          fontSize: '20px',
          fontWeight: '700',
          margin: 0,
        }}>
          ♟ Deckmate
        </h2>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}>
          <span style={{
            color: '#f1f5f9',
            fontSize: '14px',
            fontWeight: '600',
          }}>
            {user.displayName || 'Spieler'}
          </span>
          <span style={{
            color: '#64748b',
            fontSize: '12px',
          }}>
            {user.email}
          </span>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#334155',
            color: '#f1f5f9',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#475569';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#334155';
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
};
