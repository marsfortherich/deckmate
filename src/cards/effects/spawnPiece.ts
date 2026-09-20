/**
 * Spawn Piece Effect
 * 
 * Spawnt eine Figur auf einem freien Feld.
 */

import {
  EffectDefinition,
  EffectContext,
  EffectResult,
  EffectValidation,
} from '../types/effect.js';
import {
  getPieceAt,
  setPieceAt,
  isValidPosition,
} from '../../core/board/boardUtils.js';
import { Piece } from '../../core/types/index.js';

/**
 * Validierung: Position muss angegeben und frei sein
 */
function validateSpawnPiece(context: EffectContext): EffectValidation {
  const { state, params } = context;
  
  // Type Guard: Prüfe ob params vom Typ 'spawn' ist
  if (params.type !== 'spawn') {
    return {
      isValid: false,
      reason: 'Effect params must be of type "spawn"',
    };
  }
  
  // Ab hier ist TypeScript sicher, dass params.targetPosition existiert
  const { targetPosition } = params;
  
  // Prüfe ob Position gültig
  if (!isValidPosition(targetPosition)) {
    return {
      isValid: false,
      reason: 'Target position is out of bounds',
    };
  }
  
  // Prüfe ob Position frei
  const existingPiece = getPieceAt(state.boardState.board, targetPosition);
  if (existingPiece !== null) {
    return {
      isValid: false,
      reason: 'Target position is occupied',
    };
  }
  
  return { isValid: true };
}

/**
 * Führt Spawn aus
 */
function executeSpawnPiece(context: EffectContext): EffectResult {
  const { state, params, playerId } = context;
  
  // Type Guard: Sollte bereits in Validation geprüft sein
  if (params.type !== 'spawn') {
    return {
      newState: state,
      success: false,
      message: 'Invalid effect params type',
    };
  }
  
  const { targetPosition, pieceType } = params;
  
  // Erstelle neue Figur (pieceType kann undefined sein, default zu 'pawn')
  const newPiece: Piece = {
    type: pieceType || 'pawn',
    color: playerId,
    hasMoved: false,
  };
  
  // Setze Figur auf Board
  const newBoard = setPieceAt(
    state.boardState.board,
    targetPosition,
    newPiece
  );
  
  const newState = {
    ...state,
    boardState: {
      ...state.boardState,
      board: newBoard,
    },
  };
  
  return {
    newState,
    success: true,
    message: `Spawned ${pieceType || 'pawn'} at position`,
    metadata: {
      action: 'spawnPiece',
    },
  };
}

/**
 * Spawn Piece Effect Definition
 */
export const spawnPieceEffect: EffectDefinition = {
  id: 'spawn-piece',
  name: 'Spawn Piece',
  description: 'Spawn a piece on an empty square',
  type: 'board-modification',
  timing: 'immediate',
  execute: executeSpawnPiece,
  validate: validateSpawnPiece,
};
