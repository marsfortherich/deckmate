/**
 * SpecialCardDecisionDialog Component
 * 
 * Modal dialog for deciding whether to keep or shuffle back an unused special card
 */

import React from 'react';
import { Card } from '../../cards/types/card.js';

interface SpecialCardDecisionDialogProps {
  card: Card;
  onKeep: () => void;
  onShuffleBack: () => void;
}

export const SpecialCardDecisionDialog: React.FC<SpecialCardDecisionDialogProps> = ({
  card,
  onKeep,
  onShuffleBack,
}) => {
  return (
    <div style={{
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
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        padding: '32px',
        borderRadius: '12px',
        maxWidth: '500px',
        border: '2px solid #3b82f6',
      }}>
        {/* Title */}
        <h2 style={{
          color: '#f1f5f9',
          marginBottom: '16px',
          fontSize: '24px',
          textAlign: 'center',
        }}>
          🃏 Unused Special Card
        </h2>
        
        {/* Message */}
        <p style={{
          color: '#cbd5e1',
          marginBottom: '24px',
          textAlign: 'center',
          fontSize: '16px',
          lineHeight: '1.5',
        }}>
          You didn't use your special card last turn.
          <br />
          What would you like to do with it?
        </p>
        
        {/* Card Display */}
        <div style={{
          backgroundColor: '#0f172a',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #475569',
        }}>
          <div style={{
            color: '#f59e0b',
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '8px',
          }}>
            {card.name}
          </div>
          <div style={{
            color: '#94a3b8',
            fontSize: '14px',
          }}>
            {card.description}
          </div>
        </div>
        
        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
        }}>
          <button
            onClick={onShuffleBack}
            style={{
              flex: 1,
              padding: '14px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            🔄 Shuffle Back
          </button>
          
          <button
            onClick={onKeep}
            style={{
              flex: 1,
              padding: '14px 24px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#10b981';
            }}
          >
            ✓ Keep for This Turn
          </button>
        </div>
        
        {/* Help Text */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#0f172a',
          borderRadius: '6px',
          border: '1px solid #334155',
        }}>
          <div style={{
            color: '#64748b',
            fontSize: '12px',
            textAlign: 'center',
          }}>
            <strong style={{ color: '#94a3b8' }}>Shuffle Back:</strong> Return card to your deck to draw it again later
            <br />
            <strong style={{ color: '#94a3b8' }}>Keep:</strong> Card stays in your hand for this turn (no new special card drawn)
          </div>
        </div>
      </div>
    </div>
  );
};
