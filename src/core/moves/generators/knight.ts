/**
 * Springer-Move-Generator
 * 
 * Springer bewegen sich in L-Form (2+1 oder 1+2).
 * Können über andere Figuren springen.
 */

import { Board, Position, Color } from '../../types/index.js';
import { generateJumpMoves } from '../moveUtils.js';

/**
 * Alle möglichen Springer-Sprünge (L-Form)
 */
const KNIGHT_OFFSETS = [
  { row: -2, col: -1 },
  { row: -2, col:  1 },
  { row: -1, col: -2 },
  { row: -1, col:  2 },
  { row:  1, col: -2 },
  { row:  1, col:  2 },
  { row:  2, col: -1 },
  { row:  2, col:  1 },
] as const;

/**
 * Generiert mögliche Springer-Züge
 * 
 * Springer bewegen sich in L-Form und können über Figuren springen.
 * 
 * @param board - Das Spielbrett
 * @param position - Position des Springers
 * @param color - Farbe des Springers
 * @returns Array von möglichen Zielpositionen
 */
export function generateKnightMoves(
  board: Board,
  position: Position,
  color: Color
): Position[] {
  return generateJumpMoves(board, position, KNIGHT_OFFSETS, color);
}
