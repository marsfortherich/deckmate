/**
 * Opponent Draw Less Effect
 * 
 * Opponent draws one less move card next turn
 */

import { EffectDefinition, EffectContext, EffectResult } from '../types/effect.js';

export const opponentDrawLessEffect: EffectDefinition = {
  id: 'opponent-draw-less',
  name: 'Tactical Pressure',
  description: 'Opponent draws one less move card next turn',
  type: 'persistent',
  timing: 'immediate',
  
  execute: (context: EffectContext): EffectResult => {
    const { state } = context;
    
    return {
      newState: state,
      success: true,
      message: 'Opponent will draw fewer cards next turn',
      metadata: {
        action: 'opponentDrawLess',
        reduction: 1,
      },
    };
  },
  
  validate: (_context: EffectContext) => {
    return { isValid: true };
  },
};
