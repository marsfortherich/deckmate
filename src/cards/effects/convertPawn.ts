/**
 * Convert Pawn Effect
 * 
 * Turn one of opponent's pawns into your own
 */

import { EffectDefinition, EffectContext, EffectResult } from '../types/effect.js';
import { getPieceAt, setPieceAt } from '../../core/board/boardUtils.js';
import { Piece } from '../../core/types/index.js';

export const convertPawnEffect: EffectDefinition = {
  id: 'convert-pawn',
  name: 'Conversion',
  description: 'Convert one of your opponent\'s pawns to your side',
  type: 'board-modification',
  timing: 'immediate',
  
  execute: (context: EffectContext): EffectResult => {
    const { state, params, playerId, cardId } = context;
    
    if (params.type !== 'spawn' || !params.targetPosition) {
      return {
        newState: state,
        success: true,
        message: 'Select an opponent pawn to convert',
        metadata: {
          action: 'convertPawn',
          cardId,
        },
      };
    }
    
    const targetPos = params.targetPosition;
    const piece = getPieceAt(state.boardState.board, targetPos);
    
    const opponentColor = playerId === 'white' ? 'black' : 'white';
    
    if (!piece || piece.type !== 'pawn' || piece.color !== opponentColor) {
      return {
        newState: state,
        success: false,
        message: 'Must target an opponent pawn',
      };
    }
    
    // Convert pawn to player's color
    const convertedPawn: Piece = {
      ...piece,
      color: playerId,
    };
    
    const newBoard = setPieceAt(state.boardState.board, targetPos, convertedPawn);
    
    return {
      newState: {
        ...state,
        boardState: {
          ...state.boardState,
          board: newBoard,
        },
      },
      success: true,
      message: 'Converted opponent pawn',
    };
  },
  
  validate: (_context: EffectContext) => {
    return { isValid: true };
  },
};
