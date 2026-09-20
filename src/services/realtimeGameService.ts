/**
 * Realtime Game Service
 * 
 * Manages online multiplayer game state using Firebase Realtime Database
 */

import { ref, set, update, onValue, off, get } from 'firebase/database';
import { rtdb } from './firebase';
import { SerializedGameState } from './gameStateSerializer';
import { logger } from '../utils/logger';

export interface GameHistory {
  timestamp: number;
  action: 'move' | 'card' | 'decision';
  player: string;
  data: any;
}

export interface OnlineGameState {
  matchId: string;
  gameState: SerializedGameState;  // Serialized version without functions
  history: GameHistory[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Initialize game state for a match
 */
export const initializeGameState = async (
  matchId: string,
  initialGameState: SerializedGameState  // Serialized version
): Promise<void> => {
  const gameRef = ref(rtdb, `games/${matchId}`);
  
  const onlineGameState: OnlineGameState = {
    matchId,
    gameState: initialGameState,
    history: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Convert to JSON and back to ensure proper serialization
  const jsonString = JSON.stringify(onlineGameState);
  const parsedData = JSON.parse(jsonString);
  
  await set(gameRef, parsedData);

  logger.debug('🎮 Game state initialized in Realtime DB:', matchId);
};

/**
 * Update game state
 */
export const updateGameState = async (
  matchId: string,
  newGameState: SerializedGameState,  // Serialized version
  action: GameHistory
): Promise<void> => {
  const gameRef = ref(rtdb, `games/${matchId}`);
  
  logger.debug('📤 Updating game state in RTDB', {
    matchId,
    action: action.action,
    player: action.player,
  });
  
  // Get current history
  const snapshot = await get(gameRef);
  const currentData = snapshot.val() as OnlineGameState | null;
  const currentHistory = currentData?.history || [];

  const updates = {
    gameState: newGameState,
    history: [...currentHistory, { ...action, timestamp: Date.now() }],
    updatedAt: Date.now(),
  };
  
  // Convert to JSON and back to ensure proper serialization
  const jsonString = JSON.stringify(updates);
  const parsedData = JSON.parse(jsonString);
  
  await update(gameRef, parsedData);

  logger.debug('✅ Game state update complete', {
    updatedAt: parsedData.updatedAt,
    historyLength: parsedData.history.length,
  });
};

/**
 * Subscribe to game state changes (real-time)
 */
export const subscribeToGameState = (
  matchId: string,
  callback: (gameState: OnlineGameState | null) => void
): (() => void) => {
  const gameRef = ref(rtdb, `games/${matchId}`);

  logger.debug('🔗 Setting up Firebase listener for', matchId);

  const handleUpdate = (snapshot: any) => {
    const data = snapshot.val() as OnlineGameState | null;
    logger.debug('🔥 Firebase onValue triggered', {
      hasData: !!data,
      updatedAt: data?.updatedAt,
    });
    callback(data);
  };

  onValue(gameRef, handleUpdate);

  logger.debug('✅ Firebase listener active');

  // Return unsubscribe function
  return () => {
    logger.debug('🔌 Removing Firebase listener');
    off(gameRef, 'value', handleUpdate);
  };
};

/**
 * Get game state (one-time read)
 */
export const getGameState = async (
  matchId: string
): Promise<OnlineGameState | null> => {
  const gameRef = ref(rtdb, `games/${matchId}`);
  const snapshot = await get(gameRef);
  return snapshot.val() as OnlineGameState | null;
};

/**
 * Log an action to history without updating game state
 */
export const logAction = async (
  matchId: string,
  action: GameHistory
): Promise<void> => {
  const gameRef = ref(rtdb, `games/${matchId}/history`);
  const snapshot = await get(gameRef);
  const currentHistory = (snapshot.val() as GameHistory[]) || [];

  await set(gameRef, [...currentHistory, { ...action, timestamp: Date.now() }]);

  if (import.meta.env.DEV) {
    logger.debug('📝 Action logged:', { matchId, action: action.action });
  }
};
