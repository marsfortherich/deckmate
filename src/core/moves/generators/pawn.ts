/**
 * Bauern-Move-Generator
 * 
 * Bauern bewegen sich vorwärts, schlagen diagonal.
 * Unterstützt En Passant und Doppelschritt.
 */

import { Board, BoardState, Position, Color } from '../../types/index.js';
import { isValidPosition, positionsEqual } from '../../board/boardUtils.js';
import { isEmpty, isOccupiedByOpponent } from '../moveUtils.js';
import { getPieceAt } from '../../board/boardUtils.js';

/**
 * Generiert mögliche Bauern-Züge
 * 
 * Regeln:
 * - 1 Feld vorwärts (wenn frei)
 * - 2 Felder vorwärts von Startposition (wenn beide frei)
 * - Diagonal schlagen (wenn Gegner)
 * - En Passant (wenn verfügbar)
 * - Keine Rückwärts-Bewegung
 * 
 * @param board - Das Spielbrett
 * @param position - Position des Bauern
 * @param color - Farbe des Bauern
 * @param boardState - Optionaler BoardState für En Passant
 * @returns Array von möglichen Zielpositionen
 */
export function generatePawnMoves(
  board: Board,
  position: Position,
  color: Color,
  boardState?: BoardState
): Position[] {
  const moves: Position[] = [];
  
  // Vorwärts-Richtung abhängig von Farbe
  // Weiß bewegt sich "nach oben" im Board = höhere row-Werte (0->7)
  // Schwarz bewegt sich "nach unten" im Board = niedrigere row-Werte (7->0)
  const forwardDirection = color === 'white' ? 1 : -1;
  
  // 1 Feld vorwärts (nur wenn frei)
  const oneForward: Position = {
    row: position.row + forwardDirection,
    col: position.col,
  };
  
  if (isValidPosition(oneForward) && isEmpty(board, oneForward)) {
    moves.push(oneForward);
    
    // 2 Felder vorwärts (nur wenn noch nicht bewegt und beide Felder frei)
    const piece = getPieceAt(board, position);
    if (piece && !piece.hasMoved) {
      const twoForward: Position = {
        row: position.row + (forwardDirection * 2),
        col: position.col,
      };
      
      if (isValidPosition(twoForward) && isEmpty(board, twoForward)) {
        moves.push(twoForward);
      }
    }
  }
  
  // Diagonal schlagen (links und rechts)
  const captureLeft: Position = {
    row: position.row + forwardDirection,
    col: position.col - 1,
  };
  
  const captureRight: Position = {
    row: position.row + forwardDirection,
    col: position.col + 1,
  };
  
  if (isValidPosition(captureLeft) && isOccupiedByOpponent(board, captureLeft, color)) {
    moves.push(captureLeft);
  }
  
  if (isValidPosition(captureRight) && isOccupiedByOpponent(board, captureRight, color)) {
    moves.push(captureRight);
  }
  
  // En Passant
  if (boardState?.enPassantTarget) {
    const enPassantTarget = boardState.enPassantTarget;
    
    // Prüfe ob wir diagonal zum En Passant Ziel ziehen können
    if (positionsEqual(captureLeft, enPassantTarget)) {
      moves.push(captureLeft);
    }
    
    if (positionsEqual(captureRight, enPassantTarget)) {
      moves.push(captureRight);
    }
  }
  
  return moves;
}
