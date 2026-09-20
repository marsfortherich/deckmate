/**
 * Activate Used Card Effect
 * 
 * Select and activate an effect from your used/discard pile
 */

import { EffectDefinition, EffectContext, EffectResult } from '../types/effect.js';

export const activateUsedCardEffect: EffectDefinition = {
  id: 'activate-used-card',
  name: 'Recall',
  description: 'Activate the effect of one card from your used pile (without removing it)',
  type: 'board-modification',
  timing: 'immediate',
  
  execute: (context: EffectContext): EffectResult => {
    const { state, cardId } = context;
    
    return {
      newState: state,
      success: true,
      message: 'Select a card from your used pile to activate',
      metadata: {
        action: 'activateUsedCard',
        triggeringCardId: cardId,
      },
    };
  },
  
  validate: (_context: EffectContext) => {
    return { isValid: true };
  },
};
