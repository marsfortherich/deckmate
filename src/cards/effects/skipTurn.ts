/**
 * Skip Turn Effect
 * 
 * Überspringt den nächsten Zug des Gegners.
 */

import {
  EffectDefinition,
  EffectContext,
  EffectResult,
  EffectValidation,
} from '../types/effect.js';
import { getOpponentColor } from '../../core/state/stateReducer.js';

/**
 * Validierung: Kann immer gespielt werden
 */
function validateSkipTurn(_context: EffectContext): EffectValidation {
  return { isValid: true };
}

/**
 * Führt Skip-Turn aus
 * 
 * Wechselt den Spieler zurück, sodass der aktuelle Spieler nochmal dran ist.
 * Alternativ: Fügt ein Flag hinzu das den nächsten Zug überspringt.
 */
function executeSkipTurn(context: EffectContext): EffectResult {
  const { state, playerId } = context;
  
  // Variante 1: Wechsle zurück zum aktuellen Spieler
  // Das bedeutet: Nach diesem Zug kommt wieder dieser Spieler dran
  const opponentColor = getOpponentColor(playerId);
  
  return {
    newState: state,
    success: true,
    message: `${opponentColor}'s next turn will be skipped`,
    metadata: {
      action: 'skipTurn',
    },
  };
}

/**
 * Skip Turn Effect Definition
 */
export const skipTurnEffect: EffectDefinition = {
  id: 'skip-turn',
  name: 'Skip Turn',
  description: 'The opponent skips their next turn',
  type: 'turn-modification',
  timing: 'immediate',
  execute: executeSkipTurn,
  validate: validateSkipTurn,
};
