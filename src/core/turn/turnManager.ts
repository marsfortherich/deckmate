/**
 * Turn-Management
 * 
 * Verwaltet Spieler-Wechsel, Turn-Nummer und Historie.
 * Reine Funktionen basierend auf GameState.
 */

import { GameState, Move, Color } from '../types/index.js';

/**
 * Prüft, ob ein bestimmter Spieler am Zug ist
 */
export function isPlayersTurn(state: GameState, color: Color): boolean {
  return state.currentPlayer === color;
}

/**
 * Holt den letzten Zug aus der Historie
 */
export function getLastMove(state: GameState): Move | undefined {
  return state.moveHistory[state.moveHistory.length - 1];
}

/**
 * Holt alle Züge eines bestimmten Spielers
 */
export function getMovesByPlayer(
  state: GameState,
  color: Color
): readonly Move[] {
  return state.moveHistory.filter((move: Move) => move.piece.color === color);
}

/**
 * Prüft, ob das Spiel vorbei ist
 */
export function isGameOver(state: GameState): boolean {
  return state.status === 'checkmate' 
    || state.status === 'stalemate' 
    || state.status === 'draw'
    || state.status === 'resigned';
}

/**
 * Prüft, ob ein Remis durch 50-Züge-Regel möglich ist
 */
export function canClaimDrawByFiftyMoveRule(state: GameState): boolean {
  return state.halfMoveClock >= 100; // 50 Züge = 100 Halbzüge
}

/**
 * Berechnet die Anzahl der gespielten Vollzüge
 */
export function getFullMoveCount(state: GameState): number {
  return state.turnNumber;
}

/**
 * Gibt eine menschenlesbare Zug-Nummer zurück
 * z.B. "1. " für Weiß im ersten Zug, "1... " für Schwarz
 */
export function formatMoveNumber(state: GameState): string {
  const moveNum = state.turnNumber;
  return state.currentPlayer === 'white' 
    ? `${moveNum}. `
    : `${moveNum}... `;
}
