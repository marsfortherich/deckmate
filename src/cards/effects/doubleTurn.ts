/**
 * Double Turn Effect
 * 
 * Shift your turn behind opponent's, granting you 2 turns in a row
 */

import { EffectDefinition, EffectContext, EffectResult } from '../types/effect.js';

export const doubleTurnEffect: EffectDefinition = {
  id: 'double-turn',
  name: 'Time Warp',
  description: 'After opponent\'s next turn, they skip a turn',
  type: 'persistent',
  timing: 'immediate',
  
  execute: (context: EffectContext): EffectResult => {
    const { state } = context;
    
    return {
      newState: state,
      success: true,
      message: 'Opponent will skip a turn after their next turn',
      metadata: {
        action: 'doubleTurn',
      },
    };
  },
  
  validate: (_context: EffectContext) => {
    return { isValid: true };
  },
};
