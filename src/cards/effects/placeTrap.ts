/**
 * Place Trap Effect
 * 
 * Mark a field - first piece entering gets destroyed
 */

import { EffectDefinition, EffectContext, EffectResult } from '../types/effect.js';
import { BoardEffect } from '../../core/types/index.js';

export const placeTrapEffect: EffectDefinition = {
  id: 'place-trap',
  name: 'Trap Field',
  description: 'Place a trap on an empty square - first piece to enter it gets destroyed',
  type: 'persistent',
  timing: 'immediate',
  
  execute: (context: EffectContext): EffectResult => {
    const { state, params, cardId } = context;
    
    if (params.type !== 'spawn' || !params.targetPosition) {
      return {
        newState: state,
        success: true,
        message: 'Select an empty square to place trap',
        metadata: {
          action: 'placeTrap',
          cardId,
        },
      };
    }
    
    const trapPosition = params.targetPosition;
    
    // Validate that the position is empty
    const piece = state.boardState.board[trapPosition.row]?.[trapPosition.col];
    if (piece) {
      return {
        newState: state,
        success: false,
        message: 'Target square must be empty',
      };
    }
    
    // Add trap effect to board
    const trapEffect: BoardEffect = {
      id: `trap-${Date.now()}`,
      type: 'trap',
      targetPosition: trapPosition,
      remainingTurns: 999, // Lasts until triggered
      metadata: {
        owner: context.playerId,
      },
    };
    
    return {
      newState: {
        ...state,
        boardState: {
          ...state.boardState,
          effects: [...state.boardState.effects, trapEffect],
        },
      },
      success: true,
      message: `Placed trap at target position`,
    };
  },
  
  validate: (_context: EffectContext) => {
    return { isValid: true };
  },
};
