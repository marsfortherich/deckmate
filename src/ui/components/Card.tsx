/**
 * Card Components
 * 
 * Visualisierung von Karten.
 * KEINE Logik - nur Event-Weiterleitung an Parent!
 */

import React from 'react';
import { Card } from '../../cards/types/card';

interface CardComponentProps {
  card: Card;
  onClick?: () => void;
  isSelected?: boolean;
}

/**
 * Einzelne Karte
 * 
 * Regel: onClick wird nur weitergeleitet, KEINE Logik!
 */
export const CardComponent: React.FC<CardComponentProps> = ({ 
  card, 
  onClick,
  isSelected = false 
}) => {
  const rarityColors = {
    common: '#9ca3af',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    legendary: '#f59e0b',
  };
  
  const rarityColor = rarityColors[card.rarity];
  
  return (
    <div
      onClick={onClick}
      style={{
        width: '180px',
        minHeight: '240px',
        backgroundColor: '#1e293b',
        border: `3px solid ${isSelected ? '#fbbf24' : rarityColor}`,
        borderRadius: '12px',
        padding: '12px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        transform: isSelected ? 'translateY(-8px)' : 'none',
        boxShadow: isSelected 
          ? '0 8px 16px rgba(251, 191, 36, 0.4)' 
          : '0 4px 8px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        }
      }}
    >
      {/* Header */}
      <div style={{ 
        fontSize: '16px', 
        fontWeight: 'bold',
        color: rarityColor,
      }}>
        {card.name}
      </div>
      
      {/* Rarity Badge */}
      <div style={{ 
        fontSize: '11px', 
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {card.rarity}
      </div>
      
      {/* Cost */}
      {card.cost && (
        <div style={{ 
          fontSize: '14px',
          color: '#cbd5e1',
          display: 'flex',
          gap: '8px',
        }}>
          {card.cost.mana !== undefined && (
            <span>💎 {card.cost.mana}</span>
          )}
        </div>
      )}
      
      {/* Description */}
      <div style={{ 
        fontSize: '13px',
        color: '#e2e8f0',
        flexGrow: 1,
        marginTop: '8px',
      }}>
        {card.description}
      </div>
      
      {/* Flavor Text */}
      {card.flavorText && (
        <div style={{ 
          fontSize: '11px',
          color: '#64748b',
          fontStyle: 'italic',
          marginTop: '8px',
          borderTop: '1px solid #334155',
          paddingTop: '8px',
        }}>
          "{card.flavorText}"
        </div>
      )}
    </div>
  );
};

/**
 * Hand: Zeigt multiple Karten
 */
interface HandProps {
  cards: readonly Card[];
  onCardClick?: (cardId: string, index: number) => void;
  selectedCardId?: string;
  title?: string;
}

export const Hand: React.FC<HandProps> = ({ 
  cards, 
  onCardClick,
  selectedCardId,
  title = 'Hand'
}) => {
  if (cards.length === 0) {
    return (
      <div style={{ 
        padding: '24px',
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#64748b',
      }}>
        No cards in {title.toLowerCase()}
      </div>
    );
  }
  
  return (
    <div>
      <h3 style={{ marginBottom: '16px', color: '#cbd5e1' }}>
        {title} ({cards.length})
      </h3>
      
      <div style={{ 
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        padding: '16px',
        backgroundColor: '#0f172a',
        borderRadius: '8px',
      }}>
        {cards.map((card, index) => (
          <CardComponent
            key={`${card.id}-${index}`}
            card={card}
            onClick={onCardClick ? () => onCardClick(card.id, index) : undefined}
            isSelected={card.id === selectedCardId}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Dual Hand View: Move Cards + Special Cards
 */
interface DualHandProps {
  moveCards: readonly Card[];
  specialCards: readonly Card[];
  onMoveCardClick?: (cardId: string, index: number) => void;
  onSpecialCardClick?: (cardId: string, index: number) => void;
  selectedCardId?: string;
}

export const DualHand: React.FC<DualHandProps> = ({ 
  moveCards,
  specialCards,
  onMoveCardClick,
  onSpecialCardClick,
  selectedCardId,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Hand
        title="Move Cards"
        cards={moveCards}
        onCardClick={onMoveCardClick}
        selectedCardId={selectedCardId}
      />
      
      {specialCards.length > 0 && (
        <Hand
          title="Special Cards"
          cards={specialCards}
          onCardClick={onSpecialCardClick}
          selectedCardId={selectedCardId}
        />
      )}
    </div>
  );
};
