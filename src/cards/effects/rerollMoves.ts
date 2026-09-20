/**
 * Reroll Moves Effect
 * 
 * Reroll all move cards (avoiding duplicates if possible)
 */

import { EffectDefinition, EffectContext, EffectResult } from '../types/effect.js';

export const rerollMovesEffect: EffectDefinition = {
  id: 'reroll-moves',
  name: 'Reroll Moves',
  description: 'Discard all move cards and draw new ones (avoiding duplicates)',
  type: 'board-modification',
  timing: 'immediate',
  
  execute: (context: EffectContext): EffectResult => {
    return {
      newState: context.state,
      success: true,
      message: 'Rerolled all move cards',
      metadata: {
        action: 'rerollMoves',
      },
    };
  },
  
  validate: (_context: EffectContext) => {
    return { isValid: true };
  },
};
