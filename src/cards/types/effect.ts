/**
 * Effect-System Typen
 * 
 * Definiert das Effect-Resolver-System für Karten.
 */

import { GameState } from '../../core/types/index.js';
import { Position } from '../../core/types/common.js';

/**
 * Effekt-Typ Kategorien
 */
export type EffectType = 
  | 'turn-modification'   // Verändert Turn-System (z.B. Skip, Extra Turn)
  | 'board-modification'  // Verändert Brett (z.B. Spawn Piece)
  | 'instant'             // Soforteffekt ohne Dauer
  | 'persistent';         // Dauerhafter Effekt (mehrere Runden)

/**
 * Timing: Wann wird der Effekt ausgeführt?
 */
export type EffectTiming = 
  | 'immediate'           // Sofort beim Ausspielen
  | 'start-of-turn'       // Zu Beginn des Zuges
  | 'end-of-turn'         // Am Ende des Zuges
  | 'before-move'         // Vor einem Zug
  | 'after-move';         // Nach einem Zug

/**
 * Parameter für Effekt-Ausführung als Discriminated Union
 * 
 * Viel typ-sicherer als optionale Felder!
 */
export type EffectParams = 
  | { 
      readonly type: 'spawn'; 
      readonly targetPosition: Position; 
      readonly pieceType?: 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
    }
  | { readonly type: 'skip' }
  | { readonly type: 'extraMove' }
  | { 
      readonly type: 'destroy'; 
      readonly targetPosition: Position;
    }
  | { readonly type: 'none' };

/**
 * Helper: Leere Effect-Params
 */
export const NO_PARAMS: EffectParams = { type: 'none' };

/**
 * Legacy Support: Konvertiert altes Format zu neuem
 * TODO: Entfernen sobald alle Effects migriert sind
 */
export function legacyParamsAdapter(params: Record<string, unknown>): EffectParams {
  if (params.targetPosition && typeof params.targetPosition === 'object') {
    const pos = params.targetPosition as Position;
    if (params.pieceType) {
      return { type: 'spawn', targetPosition: pos, pieceType: params.pieceType as any };
    }
    return { type: 'destroy', targetPosition: pos };
  }
  return { type: 'none' };
}

/**
 * Kontext für Effekt-Ausführung
 * Enthält alle Informationen die ein Effekt braucht
 */
export interface EffectContext {
  readonly state: GameState;
  readonly params: EffectParams;
  readonly cardId: string;
  readonly playerId: 'white' | 'black';
}

/**
 * Ergebnis einer Effekt-Ausführung
 */
export interface EffectResult {
  readonly newState: GameState;
  readonly success: boolean;
  readonly message?: string;  // Feedback für UI
  readonly metadata?: Record<string, unknown>;  // Additional data for special effects
}

/**
 * Validierung: Kann der Effekt ausgeführt werden?
 */
export interface EffectValidation {
  readonly isValid: boolean;
  readonly reason?: string;
}

/**
 * Eine Effekt-Funktion
 * Pure Function: (Context) => Result
 */
export type EffectFunction = (context: EffectContext) => EffectResult;

/**
 * Validierungs-Funktion
 * Prüft ob ein Effekt ausführbar ist
 */
export type EffectValidator = (context: EffectContext) => EffectValidation;

/**
 * Effekt-Definition
 * Beschreibt einen wiederverwendbaren Effekt
 */
export interface EffectDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: EffectType;
  readonly timing: EffectTiming;
  readonly execute: EffectFunction;
  readonly validate?: EffectValidator;  // Optional: Validierung vor Ausführung
}

/**
 * Aktiver Effekt auf dem Board
 * Erweitert das BoardEffect aus core/types
 */
export interface ActiveEffect {
  readonly effectId: string;
  readonly cardId: string;
  readonly playerId: 'white' | 'black';
  readonly remainingTurns: number;
  readonly params: EffectParams;
}
