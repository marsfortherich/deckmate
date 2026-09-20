/**
 * Swap Pieces Effect
 * 
 * Swap positions of 2 of your own pieces
 */

import { EffectDefinition, EffectContext, EffectResult } from '../types/effect.js';
import { getPieceAt, setPieceAt } from '../../core/board/boardUtils.js';
import { Position } from '../../core/types/index.js';

export const swapPiecesEffect: EffectDefinition = {
  id: 'swap-pieces',
  name: 'Tactical Reposition',
  description: 'Swap the positions of two of your own pieces',
  type: 'board-modification',
  timing: 'immediate',
  
  execute: (context: EffectContext): EffectResult => {
    const { state, params, playerId, cardId } = context;
    
    // Params should contain two positions
    const pos1 = (params as any).position1 as Position | undefined;
    const pos2 = (params as any).position2 as Position | undefined;
    
    if (!pos1 || !pos2) {
      return {
        newState: state,
        success: true,
        message: 'Select two of your pieces to swap',
        metadata: {
          action: 'swapPieces',
          cardId,
        },
      };
    }
    
    const piece1 = getPieceAt(state.boardState.board, pos1);
    const piece2 = getPieceAt(state.boardState.board, pos2);
    
    if (!piece1 || !piece2) {
      return {
        newState: state,
        success: false,
        message: 'Both positions must have pieces',
      };
    }
    
    if (piece1.color !== playerId || piece2.color !== playerId) {
      return {
        newState: state,
        success: false,
        message: 'Can only swap your own pieces',
      };
    }
    
    // Swap pieces
    let newBoard = setPieceAt(state.boardState.board, pos1, piece2);
    newBoard = setPieceAt(newBoard, pos2, piece1);
    
    // Check for traps at both positions
    const trapAtPos1 = state.boardState.effects.find(
      effect => effect.type === 'trap' && 
                effect.targetPosition?.row === pos1.row && 
                effect.targetPosition?.col === pos1.col
    );
    const trapAtPos2 = state.boardState.effects.find(
      effect => effect.type === 'trap' && 
                effect.targetPosition?.row === pos2.row && 
                effect.targetPosition?.col === pos2.col
    );
    
    // If trap exists at pos1, destroy piece2 that moved there
    if (trapAtPos1) {
      newBoard = setPieceAt(newBoard, pos1, null);
    }
    
    // If trap exists at pos2, destroy piece1 that moved there
    if (trapAtPos2) {
      newBoard = setPieceAt(newBoard, pos2, null);
    }
    
    // Remove triggered traps from effects
    const updatedEffects = state.boardState.effects.filter(effect => {
      if (effect.type === 'trap') {
        if (trapAtPos1 && effect.id === trapAtPos1.id) return false;
        if (trapAtPos2 && effect.id === trapAtPos2.id) return false;
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
      message: 'Swapped piece positions',
    };
  },
  
  validate: (_context: EffectContext) => {
    return { isValid: true };
  },
};
