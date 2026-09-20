/**
 * Free Move Effect
 * 
 * Make any legal move this turn (not limited to cards)
 */

import { EffectDefinition, EffectContext, EffectResult } from '../types/effect.js';

export const freeMoveEffect: EffectDefinition = {
  id: 'free-move',
  name: 'Free Move',
  description: 'Make any legal move this turn, not limited to your move cards',
  type: 'board-modification',
  timing: 'immediate',
  
  execute: (context: EffectContext): EffectResult => {
    return {
      newState: context.state,
      success: true,
      message: 'Free move activated - select any legal move',
      metadata: {
        action: 'freeMove',
        enabled: true,
      },
    };
  },
  
  validate: (_context: EffectContext) => {
    return { isValid: true };
  },
};
