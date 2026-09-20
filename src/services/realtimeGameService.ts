/**
 * Realtime Game Service
 * 
 * Manages online multiplayer game state using Firebase Realtime Database
 */

import { ref, set, update, onValue, off, get } from 'firebase/database';
import { rtdb } from './firebase';
import { SerializedGameState } from './gameStateSerializer';

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

  if (import.meta.env.DEV) {
    console.log('🎮 Game state initialized in Realtime DB:', matchId);
    console.log('🔍 Board structure being saved:', {
      isArray: Array.isArray(parsedData.gameState.gameState.boardState.board),
      length: parsedData.gameState.gameState.boardState.board.length,
    });
  }
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
  
  console.log('📤 Updating game state in RTDB', {
    matchId,
    action: action.action,
    player: action.player,
    hasWhiteHand: !!newGameState.whiteHand,
    hasBlackHand: !!newGameState.blackHand,
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
  
  console.log('📤 About to save to Firebase:', {
    hasWhiteHand: !!parsedData.gameState.whiteHand,
    hasBlackHand: !!parsedData.gameState.blackHand,
    whiteHandKeys: parsedData.gameState.whiteHand ? Object.keys(parsedData.gameState.whiteHand) : null,
    blackHandKeys: parsedData.gameState.blackHand ? Object.keys(parsedData.gameState.blackHand) : null,
  });

  await update(gameRef, parsedData);

  console.log('✅ Game state update complete', {
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

  console.log('🔗 Setting up Firebase listener for', matchId);

  const handleUpdate = (snapshot: any) => {
    const data = snapshot.val() as OnlineGameState | null;
    console.log('🔥 Firebase onValue triggered', {
      hasData: !!data,
      updatedAt: data?.updatedAt,
    });
    callback(data);
  };

  onValue(gameRef, handleUpdate);

  console.log('✅ Firebase listener active');

  // Return unsubscribe function
  return () => {
    console.log('🔌 Removing Firebase listener');
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
    console.log('📝 Action logged:', { matchId, action: action.action });
  }
};
