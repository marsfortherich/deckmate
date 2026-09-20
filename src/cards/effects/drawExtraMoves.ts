/**
 * Draw Extra Moves Effect
 * 
 * Draw three additional move cards
 */

import { EffectDefinition, EffectContext, EffectResult } from '../types/effect.js';

export const drawExtraMovesEffect: EffectDefinition = {
  id: 'draw-extra-moves',
  name: 'Tactical Options',
  description: 'Draw three additional move cards',
  type: 'board-modification',
  timing: 'immediate',
  
  execute: (context: EffectContext): EffectResult => {
    const { state } = context;
    
    return {
      newState: state,
      success: true,
      message: 'Drew 3 additional move cards',
      metadata: {
        action: 'drawExtraMoves',
        count: 3,
      },
    };
  },
  
  validate: (_context: EffectContext) => {
    return { isValid: true };
  },
};
