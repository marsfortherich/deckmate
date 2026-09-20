/**
 * Standard-Startaufstellung eines Schachbretts
 * 
 * Erzeugt die klassische Schach-Startposition.
 * Reine Funktion ohne Seiteneffekte.
 */

import { Board, Piece, PieceType, Color } from '../types/index.js';

/**
 * Hilfsfunktion: Erstellt eine Figur
 */
function createPiece(type: PieceType, color: Color): Piece {
  return {
    type,
    color,
    hasMoved: false,
  };
}

/**
 * Erstellt die Grundreihe für eine Farbe
 * Reihenfolge: Turm, Springer, Läufer, Dame, König, Läufer, Springer, Turm
 */
function createBackRank(color: Color): ReadonlyArray<Piece> {
  return [
    createPiece('rook', color),
    createPiece('knight', color),
    createPiece('bishop', color),
    createPiece('queen', color),
    createPiece('king', color),
    createPiece('bishop', color),
    createPiece('knight', color),
    createPiece('rook', color),
  ];
}

/**
 * Erstellt eine Bauernreihe
 */
function createPawnRank(color: Color): ReadonlyArray<Piece> {
  return Array(8).fill(null).map(() => createPiece('pawn', color));
}

/**
 * Erstellt eine leere Reihe
 */
function createEmptyRank(): ReadonlyArray<null> {
  return Array(8).fill(null);
}

/**
 * Erstellt das Standard-Schachbrett
 * 
 * Reihenfolge (von Index 0 bis 7):
 * 0: Weiße Grundreihe
 * 1: Weiße Bauern
 * 2-5: Leer
 * 6: Schwarze Bauern
 * 7: Schwarze Grundreihe
 * 
 * @returns Immutables 8x8 Board
 */
export function createInitialBoard(): Board {
  return [
    createBackRank('white'),   // Reihe 1
    createPawnRank('white'),   // Reihe 2
    createEmptyRank(),         // Reihe 3
    createEmptyRank(),         // Reihe 4
    createEmptyRank(),         // Reihe 5
    createEmptyRank(),         // Reihe 6
    createPawnRank('black'),   // Reihe 7
    createBackRank('black'),   // Reihe 8
  ];
}
