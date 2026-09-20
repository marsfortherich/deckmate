/**
 * PawnPromotionDialog Component
 * 
 * Modal dialog for choosing piece type when pawn reaches end rank
 */

import React from 'react';
import { PieceType, Color } from '../../core/types/index.js';

interface PawnPromotionDialogProps {
  color: Color;
  onChoose: (pieceType: Exclude<PieceType, 'king' | 'pawn'>) => void;
}

export const PawnPromotionDialog: React.FC<PawnPromotionDialogProps> = ({
  color,
  onChoose,
}) => {
  type PromotionPiece = Exclude<PieceType, 'king' | 'pawn'>;

  const whitePieces: Array<{ type: PromotionPiece; symbol: string; name: string }> = [
    { type: 'queen', symbol: '♕', name: 'Queen' },
    { type: 'rook', symbol: '♖', name: 'Rook' },
    { type: 'bishop', symbol: '♗', name: 'Bishop' },
    { type: 'knight', symbol: '♘', name: 'Knight' },
  ];

  const blackPieces: Array<{ type: PromotionPiece; symbol: string; name: string }> = [
    { type: 'queen', symbol: '♛', name: 'Queen' },
    { type: 'rook', symbol: '♜', name: 'Rook' },
    { type: 'bishop', symbol: '♝', name: 'Bishop' },
    { type: 'knight', symbol: '♞', name: 'Knight' },
  ];

  const pieces = color === 'white' ? whitePieces : blackPieces;

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
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '2px solid #475569',
        }}
      >
        {/* Title */}
        <h2
          style={{
            textAlign: 'center',
            fontSize: '24px',
            marginBottom: '8px',
            color: '#f1f5f9',
            fontWeight: 'bold',
          }}
        >
          👑 Pawn Promotion
        </h2>

        <p
          style={{
            textAlign: 'center',
            fontSize: '14px',
            marginBottom: '24px',
            color: '#cbd5e1',
          }}
        >
          Choose which piece to promote your pawn to:
        </p>

        {/* Piece Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
          }}
        >
          {pieces.map((piece) => (
            <button
              key={piece.type}
              onClick={() => onChoose(piece.type)}
              style={{
                padding: '20px',
                backgroundColor: '#334155',
                border: '2px solid #475569',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#475569';
                e.currentTarget.style.borderColor = '#64748b';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#334155';
                e.currentTarget.style.borderColor = '#475569';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <span
                style={{
                  fontSize: '48px',
                  color: color === 'white' ? '#fff' : '#000',
                  filter: color === 'white' ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(255,255,255,0.3))',
                }}
              >
                {piece.symbol}
              </span>
              <span
                style={{
                  fontSize: '16px',
                  color: '#f1f5f9',
                  fontWeight: 'bold',
                }}
              >
                {piece.name}
              </span>
            </button>
          ))}
        </div>

        {/* Info */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '12px',
            marginTop: '16px',
            color: '#94a3b8',
            fontStyle: 'italic',
          }}
        >
          Tip: Queen is the most powerful choice in most situations
        </p>
      </div>
    </div>
  );
};
