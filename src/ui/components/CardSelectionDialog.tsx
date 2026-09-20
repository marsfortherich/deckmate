/**
 * CardSelectionDialog Component
 * 
 * Allows player to select cards from their used pile for Salvage/Recall effects
 */

import React, { useState } from 'react';
import { Card } from '../../cards/types/card.js';

interface CardSelectionDialogProps {
  cards: readonly Card[];
  action: 'recover' | 'activate';
  maxCount: number;
  onConfirm: (selectedCardIds: string[]) => void;
  onCancel: () => void;
}

/**
 * Render a selectable card
 */
const SelectableCard: React.FC<{
  card: Card;
  isSelected: boolean;
  onToggle: () => void;
  disabled: boolean;
}> = ({ card, isSelected, onToggle, disabled }) => {
  return (
    <div
      onClick={disabled && !isSelected ? undefined : onToggle}
      style={{
        padding: '8px',
        backgroundColor: isSelected ? '#3b82f6' : '#334155',
        borderRadius: '4px',
        fontSize: '13px',
        cursor: (disabled && !isSelected) ? 'not-allowed' : 'pointer',
        opacity: (disabled && !isSelected) ? 0.5 : 1,
        transition: 'all 0.2s',
        border: isSelected ? '2px solid #60a5fa' : '2px solid transparent',
      }}
    >
      <div style={{ fontWeight: 'bold', color: 'white' }}>
        {isSelected && '✓ '}{card.name}
      </div>
      <div style={{
        color: isSelected ? '#dbeafe' : '#94a3b8',
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
  );
};

export const CardSelectionDialog: React.FC<CardSelectionDialogProps> = ({
  cards,
  action,
  maxCount,
  onConfirm,
  onCancel,
}) => {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const toggleCard = (cardId: string) => {
    if (selectedCardIds.includes(cardId)) {
      setSelectedCardIds(selectedCardIds.filter(id => id !== cardId));
    } else if (selectedCardIds.length < maxCount) {
      setSelectedCardIds([...selectedCardIds, cardId]);
    }
  };

  const handleConfirm = () => {
    if (selectedCardIds.length > 0) {
      onConfirm(selectedCardIds);
    }
  };

  const title = action === 'recover' 
    ? `Select up to ${maxCount} card${maxCount > 1 ? 's' : ''} to recover`
    : 'Select a card to activate';
  
  const helpText = action === 'recover'
    ? 'Selected cards will be shuffled back into your deck'
    : "The selected card's effect will activate (without removing it from used pile)";

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid #334155',
      }}>
        <h3 style={{
          margin: '0 0 8px 0',
          color: 'white',
          fontSize: '18px',
        }}>
          {title}
        </h3>
        
        <p style={{
          margin: '0 0 16px 0',
          color: '#94a3b8',
          fontSize: '13px',
        }}>
          {helpText}
        </p>

        {cards.length === 0 ? (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: '#64748b',
            fontStyle: 'italic',
          }}>
            No cards in used pile
          </div>
        ) : (
          <>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              backgroundColor: '#1e293b',
              borderRadius: '4px',
              padding: '8px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {cards.map((card, index) => (
                  <SelectableCard
                    key={`${card.id}-${index}`}
                    card={card}
                    isSelected={selectedCardIds.includes(card.id)}
                    onToggle={() => toggleCard(card.id)}
                    disabled={!selectedCardIds.includes(card.id) && selectedCardIds.length >= maxCount}
                  />
                ))}
              </div>
            </div>

            <div style={{
              color: '#94a3b8',
              fontSize: '12px',
              marginBottom: '12px',
              textAlign: 'center',
            }}>
              {selectedCardIds.length} / {maxCount} selected
            </div>
          </>
        )}

        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              backgroundColor: '#334155',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCardIds.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedCardIds.length > 0 ? '#3b82f6' : '#334155',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedCardIds.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              opacity: selectedCardIds.length > 0 ? 1 : 0.5,
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
