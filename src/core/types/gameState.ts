/**
 * Zentraler GameState
 * 
 * Der komplette Zustand einer Schachpartie.
 * Immutable - alle Änderungen erzeugen einen neuen State.
 */

import { Color, Move, GameStatus } from './common';
import { BoardState } from './board';

/**
 * Der vollständige Spielzustand
 * 
 * Enthält alles, was nötig ist, um:
 * - Den aktuellen Spielstand zu kennen
 * - Züge zu validieren
 * - Die Historie zu verwalten
 * - Karten-Effekte anzuwenden
 */
export interface GameState {
  readonly boardState: BoardState;
  readonly currentPlayer: Color;
  readonly status: GameStatus;
  readonly moveHistory: readonly Move[];
  readonly turnNumber: number;           // Zug-Nummer (erhöht nach Schwarz)
  readonly halfMoveClock: number;        // Für 50-Züge-Regel
  readonly playerInCheck?: Color;        // Welcher Spieler im Schach steht
}

/**
 * Initialisierungs-Optionen für ein neues Spiel
 */
export interface GameConfig {
  readonly startingPlayer?: Color;       // Default: 'white'
  readonly customPosition?: BoardState;  // Optional: Eigene Startposition
}
