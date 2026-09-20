/**
 * Challenge Popup - Zeigt eingehende Match-Challenges
 */

import React from 'react';

interface ChallengePopupProps {
  challengerName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export const ChallengePopup: React.FC<ChallengePopupProps> = ({
  challengerName,
  onAccept,
  onDecline,
}) => {
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
      }}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          padding: '32px',
          borderRadius: '12px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h2 style={{ marginBottom: '16px', fontSize: '24px', color: '#f1f5f9' }}>
          ⚔️ Match-Herausforderung!
        </h2>
        <p style={{ marginBottom: '24px', fontSize: '16px', color: '#cbd5e1' }}>
          <strong>{challengerName}</strong> fordert dich zu einem Match heraus!
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onAccept}
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            ✅ Annehmen
          </button>
          <button
            onClick={onDecline}
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            ❌ Ablehnen
          </button>
        </div>
      </div>
    </div>
  );
};
