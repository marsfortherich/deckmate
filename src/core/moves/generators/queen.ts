/**
 * Damen-Move-Generator
 * 
 * Dame kombiniert Turm + Läufer (horizontal, vertikal, diagonal).
 */

import { Board, Position, Color } from '../../types/index.js';
import { generateMultiDirectionalMoves, ALL_DIRECTIONS } from '../moveUtils.js';

/**
 * Generiert mögliche Damen-Züge
 * 
 * Dame bewegt sich wie Turm + Läufer: horizontal, vertikal und diagonal.
 * 
 * @param board - Das Spielbrett
 * @param position - Position der Dame
 * @param color - Farbe der Dame
 * @returns Array von möglichen Zielpositionen
 */
export function generateQueenMoves(
  board: Board,
  position: Position,
  color: Color
): Position[] {
  return generateMultiDirectionalMoves(
    board,
    position,
    ALL_DIRECTIONS,
    color
  );
}
