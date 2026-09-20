/**
 * Restrict Moves Effect
 * 
 * Draw moves only from a chosen piece type next turn
 */

import { EffectDefinition, EffectContext, EffectResult } from '../types/effect.js';

export const restrictMovesEffect: EffectDefinition = {
  id: 'restrict-moves',
  name: 'Focus Strategy',
  description: 'Next turn, draw moves only from a chosen piece type',
  type: 'persistent',
  timing: 'immediate',
  
  execute: (context: EffectContext): EffectResult => {
    const { state } = context;
    
    return {
      newState: state,
      success: true,
      message: 'Choose a piece type for your next turn',
      metadata: {
        action: 'focusStrategy',
      },
    };
  },
  
  validate: (_context: EffectContext) => {
    return { isValid: true };
  },
};
