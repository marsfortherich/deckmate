/**
 * Move-Utilities
 * 
 * Hilfsfunktionen für Move-Generierung.
 * Pure Functions ohne Seiteneffekte.
 */

import { Board, Position, Color } from '../types/index.js';
import { getPieceAt, isValidPosition } from '../board/boardUtils.js';

/**
 * Richtungs-Vektoren für Bewegungen
 */
export const DIRECTIONS = {
  // Gerade Richtungen (Turm)
  N:  { row: -1, col:  0 },  // Nord
  S:  { row:  1, col:  0 },  // Süd
  E:  { row:  0, col:  1 },  // Ost
  W:  { row:  0, col: -1 },  // West
  
  // Diagonale Richtungen (Läufer)
  NE: { row: -1, col:  1 },  // Nord-Ost
  NW: { row: -1, col: -1 },  // Nord-West
  SE: { row:  1, col:  1 },  // Süd-Ost
  SW: { row:  1, col: -1 },  // Süd-West
} as const;

export const ORTHOGONAL_DIRECTIONS = [
  DIRECTIONS.N,
  DIRECTIONS.S,
  DIRECTIONS.E,
  DIRECTIONS.W,
] as const;

export const DIAGONAL_DIRECTIONS = [
  DIRECTIONS.NE,
  DIRECTIONS.NW,
  DIRECTIONS.SE,
  DIRECTIONS.SW,
] as const;

export const ALL_DIRECTIONS = [
  ...ORTHOGONAL_DIRECTIONS,
  ...DIAGONAL_DIRECTIONS,
] as const;

/**
 * Addiert einen Richtungsvektor zu einer Position
 */
export function addDirection(
  pos: Position,
  direction: { row: number; col: number },
  steps: number = 1
): Position {
  return {
    row: pos.row + direction.row * steps,
    col: pos.col + direction.col * steps,
  };
}

/**
 * Prüft, ob ein Feld leer ist
 */
export function isEmpty(board: Board, pos: Position): boolean {
  return getPieceAt(board, pos) === null;
}

/**
 * Prüft, ob ein Feld von einem Gegner besetzt ist
 */
export function isOccupiedByOpponent(
  board: Board,
  pos: Position,
  playerColor: Color
): boolean {
  const piece = getPieceAt(board, pos);
  return piece !== null && piece.color !== playerColor;
}

/**
 * Prüft, ob ein Feld von eigenem Spieler besetzt ist
 */
export function isOccupiedByPlayer(
  board: Board,
  pos: Position,
  playerColor: Color
): boolean {
  const piece = getPieceAt(board, pos);
  return piece !== null && piece.color === playerColor;
}

/**
 * Prüft, ob ein Zug auf ein Feld möglich ist
 * (Feld ist leer oder von Gegner besetzt)
 */
export function canMoveTo(
  board: Board,
  pos: Position,
  playerColor: Color
): boolean {
  if (!isValidPosition(pos)) {
    return false;
  }
  return isEmpty(board, pos) || isOccupiedByOpponent(board, pos, playerColor);
}

/**
 * Generiert Züge in eine Richtung bis zum Rand oder einer Blockade
 * Verwendet für Turm, Läufer, Dame
 * 
 * @param board - Das Spielbrett
 * @param start - Startposition
 * @param direction - Bewegungsrichtung
 * @param playerColor - Farbe des ziehenden Spielers
 * @param maxSteps - Maximale Schritte (default: unbegrenzt)
 * @returns Array von möglichen Zielpositionen
 */
export function generateSlidingMoves(
  board: Board,
  start: Position,
  direction: { row: number; col: number },
  playerColor: Color,
  maxSteps: number = 8
): Position[] {
  const moves: Position[] = [];
  
  for (let step = 1; step <= maxSteps; step++) {
    const targetPos = addDirection(start, direction, step);
    
    // Außerhalb des Bretts?
    if (!isValidPosition(targetPos)) {
      break;
    }
    
    // Eigene Figur blockiert?
    if (isOccupiedByPlayer(board, targetPos, playerColor)) {
      break;
    }
    
    // Feld ist frei oder Gegner
    moves.push(targetPos);
    
    // Gegner schlagen beendet die Linie
    if (isOccupiedByOpponent(board, targetPos, playerColor)) {
      break;
    }
  }
  
  return moves;
}

/**
 * Generiert Züge für mehrere Richtungen (sliding pieces)
 */
export function generateMultiDirectionalMoves(
  board: Board,
  start: Position,
  directions: ReadonlyArray<{ row: number; col: number }>,
  playerColor: Color,
  maxSteps: number = 8
): Position[] {
  const moves: Position[] = [];
  
  for (const direction of directions) {
    moves.push(
      ...generateSlidingMoves(board, start, direction, playerColor, maxSteps)
    );
  }
  
  return moves;
}

/**
 * Generiert Züge für Springer-artige Bewegungen
 * (Liste von Offset-Positionen, keine Sliding)
 */
export function generateJumpMoves(
  board: Board,
  start: Position,
  offsets: ReadonlyArray<{ row: number; col: number }>,
  playerColor: Color
): Position[] {
  const moves: Position[] = [];
  
  for (const offset of offsets) {
    const targetPos = addDirection(start, offset);
    
    if (canMoveTo(board, targetPos, playerColor)) {
      moves.push(targetPos);
    }
  }
  
  return moves;
}
