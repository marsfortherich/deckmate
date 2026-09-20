/**
 * GameOverDialog Component
 * 
 * Modal dialog shown when game ends (checkmate, stalemate, draw, resignation)
 */

import React from 'react';
import { Color, GameStatus } from '../../core/types/index.js';

interface GameOverDialogProps {
  status: GameStatus;
  winner?: Color;
  onNewGame: () => void;
  onBackToMenu?: () => void;
}

export const GameOverDialog: React.FC<GameOverDialogProps> = ({
  status,
  winner,
  onNewGame,
  onBackToMenu,
}) => {
  const getTitle = (): string => {
    switch (status) {
      case 'checkmate':
        return winner ? `${winner === 'white' ? '⚪ White' : '⚫ Black'} Wins!` : 'Checkmate!';
      case 'stalemate':
        return '🤝 Stalemate!';
      case 'draw':
        return '🤝 Draw!';
      case 'resigned':
        return winner ? `${winner === 'white' ? '⚪ White' : '⚫ Black'} Wins by Resignation!` : 'Game Over';
      default:
        return 'Game Over';
    }
  };

  const getMessage = (): string => {
    switch (status) {
      case 'checkmate':
        return winner ? `${winner === 'white' ? 'White' : 'Black'} has checkmated their opponent!` : 'The game has ended in checkmate.';
      case 'stalemate':
        return 'The game has ended in a stalemate. No legal moves available.';
      case 'draw':
        return 'The game has ended in a draw.';
      case 'resigned':
        return 'The opponent has resigned.';
      default:
        return 'The game has ended.';
    }
  };

  const getIcon = (): string => {
    switch (status) {
      case 'checkmate':
        return '👑';
      case 'stalemate':
      case 'draw':
        return '🤝';
      case 'resigned':
        return '🏳️';
      default:
        return '🏁';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '2px solid #475569',
        }}
      >
        {/* Icon */}
        <div style={{ textAlign: 'center', fontSize: '80px', marginBottom: '20px' }}>
          {getIcon()}
        </div>

        {/* Title */}
        <h2
          style={{
            textAlign: 'center',
            fontSize: '32px',
            marginBottom: '16px',
            color: '#f1f5f9',
            fontWeight: 'bold',
          }}
        >
          {getTitle()}
        </h2>

        {/* Message */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '18px',
            marginBottom: '32px',
            color: '#cbd5e1',
            lineHeight: '1.6',
          }}
        >
          {getMessage()}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onNewGame}
            style={{
              padding: '14px 28px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#10b981';
            }}
          >
            🔄 New Game
          </button>

          {onBackToMenu && (
            <button
              onClick={onBackToMenu}
              style={{
                padding: '14px 28px',
                backgroundColor: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#475569';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#64748b';
              }}
            >
              🏠 Main Menu
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
