/**
 * Turm-Move-Generator
 * 
 * Turm bewegt sich horizontal/vertikal über beliebig viele Felder.
 */

import { Board, Position, Color } from '../../types/index.js';
import { generateMultiDirectionalMoves, ORTHOGONAL_DIRECTIONS } from '../moveUtils.js';

/**
 * Generiert mögliche Turm-Züge
 * 
 * Turm bewegt sich horizontal und vertikal in alle 4 Richtungen.
 * 
 * @param board - Das Spielbrett
 * @param position - Position des Turms
 * @param color - Farbe des Turms
 * @returns Array von möglichen Zielpositionen
 */
export function generateRookMoves(
  board: Board,
  position: Position,
  color: Color
): Position[] {
  return generateMultiDirectionalMoves(
    board,
    position,
    ORTHOGONAL_DIRECTIONS,
    color
  );
}
