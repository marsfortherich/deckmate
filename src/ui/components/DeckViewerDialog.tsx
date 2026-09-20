/**
 * DeckViewerDialog Component
 * 
 * Shows deck and discard pile information for both players
 */

import React from 'react';
import { Card } from '../../cards/types/card.js';
import { Color } from '../../core/types/common.js';

interface DeckViewerDialogProps {
  // Player's deck
  myDeck: readonly Card[];
  myUsed: readonly Card[];
  myColor: Color;
  
  // Opponent's deck (fully visible)
  opponentDeck: readonly Card[];
  opponentUsed: readonly Card[];
  opponentColor: Color;
  
  onClose: () => void;
}

/**
 * Render a list of cards
 */
const CardList: React.FC<{
  cards: readonly Card[];
  title: string;
  color: string;
  showEmpty?: boolean;
}> = ({ cards, title, color, showEmpty = true }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h4 style={{
        margin: '0 0 8px 0',
        color,
        fontSize: '14px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
      }}>
        {title} ({cards.length})
      </h4>
      <div style={{
        maxHeight: '200px',
        overflowY: 'auto',
        backgroundColor: '#1e293b',
        borderRadius: '4px',
        padding: '8px',
      }}>
        {cards.length === 0 && showEmpty ? (
          <div style={{ color: '#64748b', fontStyle: 'italic', fontSize: '14px' }}>
            Empty
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {cards.map((card, index) => (
              <div
                key={`${card.id}-${index}`}
                style={{
                  padding: '8px',
                  backgroundColor: '#334155',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                <div style={{ fontWeight: 'bold', color: 'white' }}>
                  {card.name}
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '12px',
                  marginTop: '2px',
                }}>
                  {card.description}
                </div>
                <div style={{
                  marginTop: '4px',
                  fontSize: '11px',
                  color: card.rarity === 'common' ? '#94a3b8' :
                    card.rarity === 'uncommon' ? '#60a5fa' :
                    card.rarity === 'rare' ? '#a78bfa' :
                    '#fbbf24',
                }}>
                  {card.rarity}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const DeckViewerDialog: React.FC<DeckViewerDialogProps> = ({
  myDeck,
  myUsed,
  myColor,
  opponentDeck,
  opponentUsed,
  opponentColor,
  onClose,
}) => {
  const myColorName = myColor === 'white' ? 'White' : 'Black';
  const opponentColorName = opponentColor === 'white' ? 'White' : 'Black';
  const myColorHex = myColor === 'white' ? '#f0f0f0' : '#404040';
  const opponentColorHex = opponentColor === 'white' ? '#f0f0f0' : '#404040';

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
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: '2px solid #334155',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <h2 style={{
            margin: 0,
            color: 'white',
            fontSize: '24px',
          }}>
            📚 Deck & Used Cards Viewer
          </h2>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '12px',
            color: '#64748b',
          }}>
            Used pile shows special cards only. For full play history (including move cards), check the 📜 panel.
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ✕ Close
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}>
          {/* My Cards */}
          <div>
            <h3 style={{
              margin: '0 0 16px 0',
              color: myColorHex,
              fontSize: '18px',
              fontWeight: 'bold',
              borderBottom: `2px solid ${myColorHex}`,
              paddingBottom: '8px',
            }}>
              Your Cards ({myColorName})
            </h3>
            
            <CardList
              cards={myDeck}
              title="In Deck"
              color={myColorHex}
            />
            
            <CardList
              cards={myUsed}
              title="Used Special Cards"
              color={myColorHex}
            />
          </div>

          {/* Opponent's Cards */}
          <div>
            <h3 style={{
              margin: '0 0 16px 0',
              color: opponentColorHex,
              fontSize: '18px',
              fontWeight: 'bold',
              borderBottom: `2px solid ${opponentColorHex}`,
              paddingBottom: '8px',
            }}>
              Opponent's Cards ({opponentColorName})
            </h3>
            
            <CardList
              cards={opponentDeck}
              title="In Deck"
              color={opponentColorHex}
            />
            
            <CardList
              cards={opponentUsed}
              title="Used Special Cards"
              color={opponentColorHex}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
