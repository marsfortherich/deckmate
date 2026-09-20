/**
 * Extra Move Effect
 * 
 * Erlaubt einen zusätzlichen Zug für den aktuellen Spieler.
 */

import {
  EffectDefinition,
  EffectContext,
  EffectResult,
  EffectValidation,
} from '../types/effect.js';

/**
 * Validierung: Kann immer gespielt werden
 */
function validateExtraMove(_context: EffectContext): EffectValidation {
  return { isValid: true };
}

/**
 * Führt Extra Move aus
 * 
 * Fügt dem State ein Flag hinzu, das anzeigt dass der Spieler
 * einen weiteren Zug bekommt.
 * 
 * WICHTIG: Die tatsächliche Game-Loop muss dieses Flag auswerten
 * und NICHT den Spieler wechseln.
 */
function executeExtraMove(context: EffectContext): EffectResult {
  const { state, playerId } = context;
  
  // Füge Marker für Extra-Move hinzu
  const newState = {
    ...state,
    boardState: {
      ...state.boardState,
      effects: [
        ...state.boardState.effects,
        {
          id: `extra-move-${Date.now()}`,
          type: 'extra_move',
          remainingTurns: 1,
          metadata: {
            player: playerId,
          },
        },
      ],
    },
  };
  
  return {
    newState,
    success: true,
    message: `${playerId} gets an extra move`,
  };
}

/**
 * Extra Move Effect Definition
 */
export const extraMoveEffect: EffectDefinition = {
  id: 'extra-move',
  name: 'Extra Move',
  description: 'Take an additional turn after this one',
  type: 'turn-modification',
  timing: 'immediate',
  execute: executeExtraMove,
  validate: validateExtraMove,
};
