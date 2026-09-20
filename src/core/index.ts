/**
 * Core-Module: Zentrale Exports
 * 
 * Öffentliche API der Schach-Engine.
 * Alle anderen Module sollten nur über diesen Index importieren.
 */

// Constants
export * from './constants.js';

// Types
export * from './types/common.js';
export * from './types/board.js';
export * from './types/gameState.js';

// Utilities
export * from './utils/arrayUtils.js';

// Board
export * from './board/initialBoard.js';
export * from './board/boardUtils.js';

// State
export * from './state/initialState.js';
export * from './state/stateReducer.js';

// Turn Management
export * from './turn/turnManager.js';

// Moves & Validation
export * from './moves/index.js';
