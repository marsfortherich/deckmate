/**
 * Draw Card Effect
 * 
 * Draw one card from your deck
 */

import { EffectDefinition, EffectContext, EffectResult } from '../types/effect.js';

export const drawCardEffect: EffectDefinition = {
  id: 'draw-card',
  name: 'Draw Card',
  description: 'Draw one special card from your deck',
  type: 'board-modification',
  timing: 'immediate',
  
  execute: (context: EffectContext): EffectResult => {
    // This will be handled by the deck system in the controller
    return {
      newState: context.state,
      success: true,
      message: 'Drew one card from deck',
      metadata: {
        action: 'drawCard',
        count: 1,
      },
    };
  },
  
  validate: (_context: EffectContext) => {
    return { isValid: true };
  },
};
