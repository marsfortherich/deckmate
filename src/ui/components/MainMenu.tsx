/**
 * Main Menu Component
 * 
 * Entry point for navigating to deck builder or starting a game
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MainMenuProps {
  onStartGame: () => void;
  onBuildDeck: () => void;
  onTestDeck: () => void;
  onMultiplayer?: () => void;
  onMultiplayerTest?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ 
  onStartGame, 
  onBuildDeck, 
  onTestDeck,
  onMultiplayer,
  onMultiplayerTest,
}) => {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Logo/Title */}
      <div style={{ 
        textAlign: 'center',
        marginBottom: '48px',
      }}>
        <h1 style={{ 
          fontSize: '64px',
          marginBottom: '16px',
          color: '#f1f5f9',
          textShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
        }}>
          ♟️ Deckmate
        </h1>
        <p style={{ 
          fontSize: '24px',
          color: '#94a3b8',
          marginBottom: '8px',
        }}>
          Card-Based Chess
        </p>
        <p style={{ 
          fontSize: '16px',
          color: '#64748b',
        }}>
          Strategic chess meets deck building
        </p>
      </div>
      
      {/* Menu Options */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '400px',
      }}>
        <button
          onClick={onStartGame}
          style={{
            padding: '20px 40px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#059669';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#10b981';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }}
        >
          ⚡ Quick Play
        </button>
        
        <button
          onClick={onBuildDeck}
          style={{
            padding: '20px 40px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }}
        >
          🃏 Build Deck
        </button>
        
        <button
          onClick={onTestDeck}
          style={{
            padding: '20px 40px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#7c3aed';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#8b5cf6';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }}
        >
          🧪 Test Deck (All Cards)
        </button>
        
        <button
          onClick={() => navigate('/friends')}
          style={{
            padding: '20px 40px',
            backgroundColor: '#06b6d4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0891b2';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#06b6d4';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }}
        >
          👥 Friends
        </button>
        
        <button
          onClick={() => navigate('/match-test')}
          style={{
            padding: '20px 40px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#7c3aed';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#8b5cf6';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }}
        >
          🎮 Match Test
        </button>
        
        {/* Multiplayer Section */}
        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '2px solid #374151',
        }}>
          <h3 style={{
            color: '#f1f5f9',
            fontSize: '18px',
            marginBottom: '12px',
            textAlign: 'center',
          }}>
            🎮 Multiplayer (Hot Seat)
          </h3>
          
          {onMultiplayer && (
            <button
              onClick={onMultiplayer}
              style={{
                width: '100%',
                padding: '20px 40px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                marginBottom: '12px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d97706';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f59e0b';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              👥 Multiplayer - Build Decks
            </button>
          )}
          
          {onMultiplayerTest && (
            <button
              onClick={onMultiplayerTest}
              style={{
                width: '100%',
                padding: '16px 32px',
                backgroundColor: '#ec4899',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#db2777';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ec4899';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              🧪 Quick Multiplayer Test
            </button>
          )}
        </div>
        
        <div style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: '#16213e',
          borderRadius: '8px',
          border: '1px solid #374151',
        }}>
          <h3 style={{
            color: '#f1f5f9',
            fontSize: '16px',
            marginBottom: '8px',
          }}>
            How to Play
          </h3>
          <ul style={{
            color: '#94a3b8',
            fontSize: '14px',
            paddingLeft: '20px',
            marginTop: '8px',
          }}>
            <li>Each turn, draw up to 5 move cards from legal chess moves</li>
            <li>Draw 1 special card from your custom deck</li>
            <li>Play move cards to make chess moves</li>
            <li>Use special cards for unique abilities</li>
            <li>Keep or discard unused special cards each turn</li>
          </ul>
        </div>
      </div>
      
      {/* Footer */}
      <div style={{
        marginTop: '48px',
        color: '#64748b',
        fontSize: '14px',
        textAlign: 'center',
      }}>
        <p>Version 1.0.0 • Built with React + TypeScript</p>
      </div>
    </div>
  );
};
