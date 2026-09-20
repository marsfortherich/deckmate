/**
 * Initialisierung des Game-State
 * 
 * Erstellt den Start-Zustand einer neuen Partie.
 * Reine Funktion ohne Seiteneffekte.
 */

import { GameState, GameConfig } from '../types/index.js';
import { createInitialBoard } from '../board/initialBoard.js';
import { createEmptyBoardState } from '../board/boardUtils.js';

/**
 * Erstellt den initialen GameState für eine neue Partie
 * 
 * @param config - Optionale Konfiguration (z.B. eigene Startposition)
 * @returns Neuer GameState
 */
export function createInitialGameState(config?: GameConfig): GameState {
  const board = config?.customPosition?.board ?? createInitialBoard();
  const boardState = config?.customPosition ?? createEmptyBoardState(board);

  return {
    boardState,
    currentPlayer: config?.startingPlayer ?? 'white',
    status: 'active',
    moveHistory: [],
    turnNumber: 1,
    halfMoveClock: 0,
  };
}
