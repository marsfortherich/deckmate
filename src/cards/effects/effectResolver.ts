/**
 * Effect-Resolver
 * 
 * Zentrale Engine für Effekt-Ausführung.
 * Validiert, orchestriert und führt Karten-Effekte aus.
 */

import { GameState } from '../../core/types/index.js';
import {
  EffectDefinition,
  EffectContext,
  EffectResult,
  EffectValidation,
  EffectParams,
} from '../types/effect.js';
import { Card } from '../types/card.js';

/**
 * Prüft ob die Karten-Anforderungen erfüllt sind
 * 
 * @param state - Aktueller GameState
 * @param card - Die zu spielende Karte
 * @param playerId - Spieler der die Karte spielt
 * @returns Validierungs-Ergebnis
 */
export function validateCardRequirements(
  state: GameState,
  card: Card,
  playerId: 'white' | 'black'
): EffectValidation {
  const req = card.requirements;
  
  if (!req) {
    return { isValid: true };
  }
  
  // Zug-Nummer prüfen
  if (req.minTurn !== undefined && state.turnNumber < req.minTurn) {
    return {
      isValid: false,
      reason: `Card can only be played from turn ${req.minTurn} onwards`,
    };
  }
  
  // Farb-Beschränkung prüfen
  if (req.playerColor !== undefined && playerId !== req.playerColor) {
    return {
      isValid: false,
      reason: `Card can only be played by ${req.playerColor}`,
    };
  }
  
  // Schach-Anforderung prüfen
  if (req.requiresCheck && state.playerInCheck !== playerId) {
    return {
      isValid: false,
      reason: 'Card requires your king to be in check',
    };
  }
  
  return { isValid: true };
}

/**
 * Führt einen Effekt aus
 * 
 * @param state - Aktueller GameState
 * @param effect - Effekt-Definition
 * @param params - Effekt-Parameter
 * @param cardId - ID der Karte
 * @param playerId - Spieler der die Karte spielt
 * @returns Effekt-Ergebnis mit neuem State
 */
export function executeEffect(
  state: GameState,
  effect: EffectDefinition,
  params: EffectParams,
  cardId: string,
  playerId: 'white' | 'black'
): EffectResult {
  const context: EffectContext = {
    state,
    params,
    cardId,
    playerId,
  };
  
  // Optional: Validierung prüfen
  if (effect.validate) {
    const validation = effect.validate(context);
    if (!validation.isValid) {
      return {
        newState: state,
        success: false,
        message: validation.reason,
      };
    }
  }
  
  // Effekt ausführen
  return effect.execute(context);
}

/**
 * Spielt eine Karte aus
 * 
 * Vollständiger Workflow:
 * 1. Karten-Anforderungen prüfen
 * 2. Effekt validieren
 * 3. Effekt ausführen
 * 4. State zurückgeben
 * 
 * @param state - Aktueller GameState
 * @param card - Die zu spielende Karte
 * @param params - Effekt-Parameter
 * @param playerId - Spieler der die Karte spielt
 * @returns Effekt-Ergebnis mit neuem State
 */
export function playCard(
  state: GameState,
  card: Card,
  params: EffectParams,
  playerId: 'white' | 'black'
): EffectResult {
  // 1. Prüfe Karten-Anforderungen
  const reqValidation = validateCardRequirements(state, card, playerId);
  if (!reqValidation.isValid) {
    return {
      newState: state,
      success: false,
      message: reqValidation.reason,
    };
  }
  
  // 2. Führe Effekt aus
  return executeEffect(state, card.effect, params, card.id, playerId);
}

/**
 * Effekt-Stack: Mehrere Effekte hintereinander ausführen
 * 
 * Ermöglicht das Stapeln mehrerer Effekte.
 * Wenn ein Effekt fehlschlägt, wird der vorherige State zurückgegeben.
 * 
 * @param state - Start-State
 * @param effects - Array von Effekt-Definitionen
 * @param params - Array von Parametern (muss gleiche Länge haben)
 * @param cardId - Karten-ID
 * @param playerId - Spieler
 * @returns Finales Ergebnis
 */
export function executeEffectStack(
  state: GameState,
  effects: EffectDefinition[],
  params: EffectParams[],
  cardId: string,
  playerId: 'white' | 'black'
): EffectResult {
  let currentState = state;
  
  for (let i = 0; i < effects.length; i++) {
    const result = executeEffect(
      currentState,
      effects[i],
      params[i],
      cardId,
      playerId
    );
    
    if (!result.success) {
      // Rollback: Gebe ursprünglichen State zurück
      return {
        newState: state,
        success: false,
        message: `Effect ${i + 1} failed: ${result.message}`,
      };
    }
    
    currentState = result.newState;
  }
  
  return {
    newState: currentState,
    success: true,
    message: `All ${effects.length} effects executed successfully`,
  };
}

/**
 * Counter-System: Effekt verhindern
 * 
 * Ermöglicht es, einen Effekt zu countern (z.B. durch Counter-Karten).
 * Dies ist ein Platzhalter für ein erweitertes Counter-System.
 * 
 * @param effect - Zu counternder Effekt
 * @param counterCard - Counter-Karte
 * @returns true wenn gecountert
 */
export function canCounterEffect(
  _effect: EffectDefinition,
  _counterCard: Card
): boolean {
  // Beispiel: Counter nur wenn Typen kompatibel sind
  // In einer echten Implementierung würde hier komplexere Logik stehen
  
  // Placeholder: Counter-Karten könnten ein "counters"-Array haben
  // return counterCard.counters?.includes(effect.id) ?? false;
  
  return false; // Noch nicht implementiert
}

/**
 * Führt persistente Effekte aus
 * 
 * Wird zu Beginn/Ende eines Zuges aufgerufen.
 * Dekrementiert remainingTurns und führt Effekte aus.
 * 
 * @param state - Aktueller GameState
 * @param timing - Wann (start-of-turn, end-of-turn)
 * @returns Neuer State nach Effekt-Ausführung
 */
export function processPersistentEffects(
  state: GameState,
  _timing: 'start-of-turn' | 'end-of-turn'
): GameState {
  // Hole aktive Effekte vom Board
  const activeEffects = state.boardState.effects;
  
  if (activeEffects.length === 0) {
    return state;
  }
  
  // TODO: Filtere Effekte nach Timing, führe aus, dekrementiere Turns
  // Für jetzt: Einfach Effekte mit remainingTurns <= 0 entfernen
  
  const updatedEffects = activeEffects
    .map((effect) => ({
      ...effect,
      remainingTurns: effect.remainingTurns - 1,
    }))
    .filter((effect) => effect.remainingTurns > 0);
  
  return {
    ...state,
    boardState: {
      ...state.boardState,
      effects: updatedEffects,
    },
  };
}
