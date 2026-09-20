/**
 * Game Controller Interface
 * 
 * Öffentliche API für UI.
 * Ermöglicht Dependency Injection & Testing.
 */

import { Color } from '../../core/index.js';
import { Card, EffectParams } from '../types/index.js';
import { HandStats } from '../types/handStats.js';

/**
 * Öffentliche View für UI
 * Nur das was UI sehen darf
 */
export interface PlayerView {
  readonly currentPlayer: Color;
  readonly turnNumber: number;
  readonly status: string;
  readonly board: import('../../core/index.js').Board;
  readonly boardEffects?: readonly import('../../core/types/common.js').BoardEffect[];
  readonly myHand: {
    readonly moveCards: readonly Card[];
    readonly specialCards: readonly Card[];
    readonly stats: HandStats;
  };
  readonly opponentHandSize: number;
  readonly canPlayCard: boolean;
  // Optional deck information (for enhanced controller with deck building)
  readonly deckSize?: number;
  readonly discardSize?: number;
  // Optional free move flag
  readonly freeMoveEnabled?: boolean;
  // Optional pending piece type choice (for Focus Strategy card)
  readonly pendingPieceTypeChoice?: boolean;
  // Optional pending card selection (for Salvage/Recall cards)
  readonly pendingCardSelection?: {
    action: 'recover' | 'activate';
    maxCount: number;
    triggeringCardId: string;
  };
  // Optional pending board action (for Tactical Reposition, Trap Field, Conversion)
  readonly pendingBoardAction?: {
    action: 'swapPieces' | 'placeTrap' | 'convertPawn';
    cardId: string;
  };
}

/**
 * Ergebnis einer Aktion
 */
export interface ActionResult {
  readonly success: boolean;
  readonly message: string;
  readonly newView?: PlayerView;
}

/**
 * Game Controller Interface
 * 
 * Abstrahiert GameController für:
 * - Dependency Injection
 * - Mock-Controller in Tests
 * - Verschiedene Controller-Implementierungen
 */
export interface IGameController {
  /**
   * Gibt View für einen Spieler zurück
   * 
   * WICHTIG: Spieler sieht nur seine eigene Hand!
   */
  getPlayerView(player: Color): PlayerView;
  
  /**
   * Spielt eine Karte aus
   * 
   * Zentrale Methode für UI.
   * Validiert & führt Karte aus.
   * 
   * @param player - Spieler der die Karte spielt
   * @param cardId - ID der Karte
   * @param params - Parameter für Karten-Effekt
   * @param isMoveCard - Ist es eine Zugkarte? (default: true)
   */
  playCardAction(
    player: Color,
    cardId: string,
    params?: EffectParams,
    isMoveCard?: boolean
  ): ActionResult;
  
  /**
   * Fügt Spezialkarte zur Hand hinzu
   * 
   * Wird z.B. beim Ziehen aus Deck verwendet.
   */
  drawSpecialCard(player: Color, card: Card): ActionResult;
}
