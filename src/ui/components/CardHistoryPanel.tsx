/**
 * CardHistoryPanel Component
 * 
 * Shows history of all cards played during the game
 */

import React from 'react';
import { Card } from '../../cards/types/card.js';
import { Color } from '../../core/types/common.js';

interface CardHistoryEntry {
  player: Color;
  card: Card;
  turnNumber: number;
  isMoveCard: boolean;
}

interface CardHistoryPanelProps {
  history: readonly CardHistoryEntry[];
  isExpanded: boolean;
  onToggle: () => void;
}

export const CardHistoryPanel: React.FC<CardHistoryPanelProps> = ({
  history,
  isExpanded,
  onToggle,
}) => {
  // Reverse history to show most recent first
  const reversedHistory = [...history].reverse();

  return (
    <div style={{
      position: 'fixed',
      right: '24px',
      top: '24px',
      width: isExpanded ? '320px' : '60px',
      backgroundColor: '#0f172a',
      border: '2px solid #334155',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
      transition: 'width 0.3s ease',
      zIndex: 100,
    }}>
      {/* Header */}
      <div
        onClick={onToggle}
        style={{
          padding: '12px',
          borderBottom: isExpanded ? '1px solid #334155' : 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1e293b',
          borderTopLeftRadius: '6px',
          borderTopRightRadius: '6px',
        }}
      >
        {isExpanded ? (
          <>
            <div style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
            }}>
              📜 Play History ({history.length})
            </div>
            <div style={{
              color: '#64748b',
              fontSize: '10px',
              marginTop: '2px',
            }}>
              All cards played
            </div>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>
              ▼
            </div>
          </>
        ) : (
          <div style={{
            color: 'white',
            fontSize: '24px',
            textAlign: 'center',
            width: '100%',
          }}>
            📜
          </div>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '8px',
        }}>
          {reversedHistory.length === 0 ? (
            <div style={{
              color: '#64748b',
              fontStyle: 'italic',
              fontSize: '14px',
              textAlign: 'center',
              padding: '16px',
            }}>
              No cards played yet
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              {reversedHistory.map((entry, index) => {
                const playerColor = entry.player === 'white' ? '#f0f0f0' : '#404040';
                const cardTypeColor = entry.isMoveCard ? '#60a5fa' : '#a78bfa';
                const cardTypeBadge = entry.isMoveCard ? '♟' : '✨';

                return (
                  <div
                    key={`${entry.turnNumber}-${entry.card.id}-${index}`}
                    style={{
                      padding: '8px',
                      backgroundColor: '#1e293b',
                      borderRadius: '4px',
                      borderLeft: `3px solid ${playerColor}`,
                    }}
                  >
                    {/* Turn and Player */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}>
                      <div style={{
                        fontSize: '11px',
                        color: '#64748b',
                        fontWeight: 'bold',
                      }}>
                        Turn {entry.turnNumber}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: playerColor,
                        fontWeight: 'bold',
                      }}>
                        {entry.player === 'white' ? 'White' : 'Black'}
                      </div>
                    </div>

                    {/* Card Name */}
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: 'white',
                      marginBottom: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <span style={{ color: cardTypeColor }}>{cardTypeBadge}</span>
                      <span>{entry.card.name}</span>
                    </div>

                    {/* Card Description */}
                    <div style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      lineHeight: '1.4',
                    }}>
                      {entry.card.description}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
