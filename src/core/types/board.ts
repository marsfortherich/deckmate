/**
 * Board-spezifische Typen
 * 
 * Definiert die Repräsentation des Schachbretts und dessen Zustand.
 */

import { Piece, Position, BoardEffect } from './common';

/**
 * Das Schachbrett als 8x8 Matrix
 * null = leeres Feld
 * 
 * Immutable: Jede Änderung erzeugt ein neues Board
 */
export type Board = ReadonlyArray<ReadonlyArray<Piece | null>>;

/**
 * Rochade-Rechte für beide Spieler
 */
export interface CastlingRights {
  readonly whiteKingSide: boolean;
  readonly whiteQueenSide: boolean;
  readonly blackKingSide: boolean;
  readonly blackQueenSide: boolean;
}

/**
 * Erweiterte Board-Informationen für Spezialregeln
 */
export interface BoardState {
  readonly board: Board;
  readonly enPassantTarget?: Position;  // Feld, auf dem en passant möglich ist
  readonly castlingRights: CastlingRights; // Rochade-Möglichkeiten
  readonly effects: readonly BoardEffect[]; // Aktive Karten-Effekte
}

/**
 * Ergebnis einer Bewegungs-Validierung
 */
export interface MoveValidation {
  readonly isValid: boolean;
  readonly reason?: string;  // Warum ungültig (für Debugging/UI)
}

/**
 * Mögliche Züge von einer Position aus
 */
export interface AvailableMoves {
  readonly from: Position;
  readonly moves: readonly Position[];
}
