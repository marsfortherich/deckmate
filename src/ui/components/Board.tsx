/**
 * Board Component
 * 
 * Zeigt das Schachbrett an.
 * KEINE Spiellogik - nur Visualisierung!
 * 
 * Props:
 * - board: Board-State vom Controller
 * - onSquareClick?: Optional Click-Handler
 */

import React from 'react';
import { Board as BoardType, Piece, Position } from '../../core/index';
import { BoardEffect } from '../../core/types/common';

interface BoardProps {
  board: BoardType;
  onSquareClick?: (position: Position) => void;
  highlightedSquares?: Position[];
  boardEffects?: readonly BoardEffect[];
}

/**
 * Einzelnes Feld auf dem Brett
 */
interface SquareProps {
  piece: Piece | null;
  position: Position;
  isLight: boolean;
  isHighlighted: boolean;
  hasTrap: boolean;
  onClick: () => void;
}

const Square: React.FC<SquareProps> = ({ 
  piece, 
  isLight, 
  isHighlighted,
  hasTrap,
  onClick 
}) => {
  const backgroundColor = isHighlighted 
    ? '#7fb069' 
    : isLight 
    ? '#f0d9b5' 
    : '#b58863';
  
  const whitePieceSymbols = {
    pawn: '♙',
    knight: '♘',
    bishop: '♗',
    rook: '♖',
    queen: '♕',
    king: '♔',
  };

  const blackPieceSymbols = {
    pawn: '♟',
    knight: '♞',
    bishop: '♝',
    rook: '♜',
    queen: '♛',
    king: '♚',
  };
  
  return (
    <div
      onClick={onClick}
      style={{
        width: '60px',
        height: '60px',
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background-color 0.2s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!isHighlighted) {
          e.currentTarget.style.backgroundColor = isLight ? '#e8d1a5' : '#a57853';
        }
      }}
      onMouseLeave={(e) => {
        if (!isHighlighted) {
          e.currentTarget.style.backgroundColor = backgroundColor;
        }
      }}
    >
      {hasTrap && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        >
          💣
        </div>
      )}
      {piece && (
        <span style={{ color: '#000' }}>
          {piece.color === 'white' ? whitePieceSymbols[piece.type] : blackPieceSymbols[piece.type]}
        </span>
      )}
    </div>
  );
};

/**
 * Schachbrett-Komponente
 * 
 * Regel: NUR ANZEIGE, KEINE LOGIK!
 */
export const BoardComponent: React.FC<BoardProps> = ({ 
  board, 
  onSquareClick,
  highlightedSquares = [],
  boardEffects = []
}) => {
  const isHighlighted = (row: number, col: number): boolean => {
    return highlightedSquares.some(
      pos => pos.row === row && pos.col === col
    );
  };
  
  const hasTrap = (row: number, col: number): boolean => {
    return boardEffects.some(
      effect => effect.type === 'trap' && 
                effect.targetPosition?.row === row && 
                effect.targetPosition?.col === col
    );
  };
  
  return (
    <div
      style={{
        display: 'inline-block',
        border: '4px solid #333',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      {board.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex' }}>
          {row.map((piece, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const position: Position = { row: rowIndex, col: colIndex };
            
            return (
              <Square
                key={`${rowIndex}-${colIndex}`}
                piece={piece}
                position={position}
                isLight={isLight}
                isHighlighted={isHighlighted(rowIndex, colIndex)}
                hasTrap={hasTrap(rowIndex, colIndex)}
                onClick={() => onSquareClick?.(position)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

/**
 * Board Info: Zeigt Koordinaten und Metadaten
 */
export const BoardInfo: React.FC<{ 
  currentPlayer: string;
  turnNumber: number;
  status: string;
}> = ({ currentPlayer, turnNumber, status }) => {
  return (
    <div style={{ 
      padding: '16px', 
      backgroundColor: '#16213e',
      borderRadius: '8px',
      marginTop: '16px',
    }}>
      <div style={{ marginBottom: '8px' }}>
        <strong>Current Player:</strong> {currentPlayer === 'white' ? '⚪ White' : '⚫ Black'}
      </div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Turn:</strong> {turnNumber}
      </div>
      <div>
        <strong>Status:</strong> {status}
      </div>
    </div>
  );
};
