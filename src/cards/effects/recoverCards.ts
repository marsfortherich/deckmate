/**
 * Recover Cards Effect
 * 
 * Select 2 cards from used stack and add back to deck
 */

import { EffectDefinition, EffectContext, EffectResult } from '../types/effect.js';

export const recoverCardsEffect: EffectDefinition = {
  id: 'recover-cards',
  name: 'Salvage',
  description: 'Recover 2 cards from your used pile and shuffle them back into your deck',
  type: 'board-modification',
  timing: 'immediate',
  
  execute: (context: EffectContext): EffectResult => {
    const { state, cardId } = context;
    
    return {
      newState: state,
      success: true,
      message: 'Select 2 cards from used pile to recover',
      metadata: {
        action: 'recoverCards',
        count: 2,
        triggeringCardId: cardId,
      },
    };
  },
  
  validate: (_context: EffectContext) => {
    return { isValid: true };
  },
};
