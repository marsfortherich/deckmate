/**
 * Steal Card Effect
 * 
 * Draw a random card from opponent's deck
 */

import { EffectDefinition, EffectContext, EffectResult } from '../types/effect.js';

export const stealCardEffect: EffectDefinition = {
  id: 'steal-card',
  name: 'Espionage',
  description: 'Draw a random card from your opponent\'s deck',
  type: 'board-modification',
  timing: 'immediate',
  
  execute: (context: EffectContext): EffectResult => {
    const { state } = context;
    
    return {
      newState: state,
      success: true,
      message: 'Drawing a card from opponent\'s deck...',
      metadata: {
        action: 'stealCard',
      },
    };
  },
  
  validate: (_context: EffectContext) => {
    return { isValid: true };
  },
};
