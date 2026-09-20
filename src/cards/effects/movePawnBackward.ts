/**
 * Move Pawn Backward Effect
 * 
 * Move a pawn of your choice one field backwards if space is empty
 */

import { EffectDefinition, EffectContext, EffectResult } from '../types/effect.js';
import { getPieceAt, movePiece, setPieceAt } from '../../core/board/boardUtils.js';
import { Position } from '../../core/types/index.js';

export const movePawnBackwardEffect: EffectDefinition = {
  id: 'move-pawn-backward',
  name: 'Retreat Pawn',
  description: 'Move one of your pawns backwards one square (if empty)',
  type: 'board-modification',
  timing: 'immediate',
  
  execute: (context: EffectContext): EffectResult => {
    const { state, params, playerId } = context;
    
    if (params.type !== 'spawn' || !params.targetPosition) {
      return {
        newState: state,
        success: false,
        message: 'Target position required',
      };
    }
    
    const pawnPos = params.targetPosition;
    const piece = getPieceAt(state.boardState.board, pawnPos);
    
    if (!piece || piece.type !== 'pawn' || piece.color !== playerId) {
      return {
        newState: state,
        success: false,
        message: 'Must select one of your pawns',
      };
    }
    
    // Calculate backward position
    const backwardDirection = playerId === 'white' ? -1 : 1;
    const backwardPos: Position = {
      row: pawnPos.row + backwardDirection,
      col: pawnPos.col,
    };
    
    // Check if backward position is empty
    const targetPiece = getPieceAt(state.boardState.board, backwardPos);
    if (targetPiece !== null) {
      return {
        newState: state,
        success: false,
        message: 'Space behind pawn is not empty',
      };
    }
    
    // Move pawn backward
    let newBoard = movePiece(state.boardState.board, pawnPos, backwardPos);
    
    // Check for trap at destination
    const trapAtDestination = state.boardState.effects.find(
      effect => effect.type === 'trap' && 
                effect.targetPosition?.row === backwardPos.row && 
                effect.targetPosition?.col === backwardPos.col
    );
    
    // If trap exists, destroy the piece that moved there
    if (trapAtDestination) {
      newBoard = setPieceAt(newBoard, backwardPos, null);
    }
    
    // Remove triggered trap from effects
    const updatedEffects = state.boardState.effects.filter(effect => {
      if (effect.type === 'trap' && trapAtDestination && effect.id === trapAtDestination.id) {
        return false;
      }
      return true;
    });
    
    return {
      newState: {
        ...state,
        boardState: {
          ...state.boardState,
          board: newBoard,
          effects: updatedEffects,
        },
      },
      success: true,
      message: `Moved pawn backward`,
      metadata: {
        action: 'movePawnBackward',
      },
    };
  },
  
  validate: (_context: EffectContext) => {
    return { isValid: true };
  },
};
