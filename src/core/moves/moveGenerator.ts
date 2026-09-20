/**
 * Zentrale Move-Generierung
 * 
 * Dispatcht zu den figur-spezifischen Generatoren.
 */

import { Board, BoardState, Position, Color } from '../types/index.js';
import { getPieceAt } from '../board/boardUtils.js';
import {
  generatePawnMoves,
  generateKnightMoves,
  generateBishopMoves,
  generateRookMoves,
  generateQueenMoves,
  generateKingMoves,
} from './generators/index.js';

/**
 * Generiert alle möglichen Züge für eine Figur an einer Position
 * 
 * WICHTIG: Berücksichtigt NICHT Schach-Prüfung!
 * Diese Funktion gibt "pseudo-legale" Züge zurück.
 * 
 * @param board - Das Spielbrett
 * @param position - Position der Figur
 * @param boardState - Optionaler BoardState für Spezialregeln (Rochade, En Passant)
 * @returns Array von möglichen Zielpositionen
 */
export function generatePieceMoves(
  board: Board,
  position: Position,
  boardState?: BoardState
): Position[] {
  const piece = getPieceAt(board, position);
  
  if (!piece) {
    return []; // Keine Figur an dieser Position
  }
  
  // Dispatche zum richtigen Generator
  switch (piece.type) {
    case 'pawn':
      return generatePawnMoves(board, position, piece.color, boardState);
    case 'knight':
      return generateKnightMoves(board, position, piece.color);
    case 'bishop':
      return generateBishopMoves(board, position, piece.color);
    case 'rook':
      return generateRookMoves(board, position, piece.color);
    case 'queen':
      return generateQueenMoves(board, position, piece.color);
    case 'king':
      return generateKingMoves(board, position, piece.color, boardState);
    default:
      return [];
  }
}

/**
 * Generiert alle möglichen Züge für einen Spieler
 * 
 * @param board - Das Spielbrett
 * @param color - Farbe des Spielers
 * @param boardState - Optionaler BoardState für Spezialregeln
 * @returns Array von Zügen (from + to Positionen)
 */
export function generateAllMoves(
  board: Board,
  color: Color,
  boardState?: BoardState
): Array<{ from: Position; to: Position }> {
  const moves: Array<{ from: Position; to: Position }> = [];
  
  // Iteriere über alle Felder
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const position: Position = { row, col };
      const piece = getPieceAt(board, position);
      
      // Nur eigene Figuren
      if (piece && piece.color === color) {
        const destinations = generatePieceMoves(board, position, boardState);
        
        for (const to of destinations) {
          moves.push({ from: position, to });
        }
      }
    }
  }
  
  return moves;
}
