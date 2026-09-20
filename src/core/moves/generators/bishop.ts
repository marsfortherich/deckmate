/**
 * Läufer-Move-Generator
 * 
 * Läufer bewegen sich diagonal über beliebig viele Felder.
 */

import { Board, Position, Color } from '../../types/index.js';
import { generateMultiDirectionalMoves, DIAGONAL_DIRECTIONS } from '../moveUtils.js';

/**
 * Generiert mögliche Läufer-Züge
 * 
 * Läufer bewegen sich diagonal in alle 4 Richtungen.
 * 
 * @param board - Das Spielbrett
 * @param position - Position des Läufers
 * @param color - Farbe des Läufers
 * @returns Array von möglichen Zielpositionen
 */
export function generateBishopMoves(
  board: Board,
  position: Position,
  color: Color
): Position[] {
  return generateMultiDirectionalMoves(
    board,
    position,
    DIAGONAL_DIRECTIONS,
    color
  );
}
