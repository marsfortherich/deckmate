/**
 * Game Controller
 * 
 * Zentrale Schnittstelle zwischen UI und Game-Logik.
 * UI hat KEINEN direkten Zugriff auf GameState.
 * 
 * Orchestriert:
 * - Schach-Engine
 * - Kartensystem
 * - Hand-Management
 */

import { GameState, GameConfig, Color, createInitialGameState } from '../core/index.js';
import { Card, EffectParams, NO_PARAMS } from './types/index.js';
import { playCard } from './effects/effectResolver.js';
import {
  HandManager,
  PlayerHand,
  HandConfig,
  DEFAULT_HAND_CONFIG,
} from './moveCards/handManagerV2.js';
import { IGameController, PlayerView, ActionResult } from './gameController/IGameController.js';

// Re-export for consumers
export type { IGameController, PlayerView, ActionResult };

/**
 * Vollständiger Spiel-Zustand
 * Kapselt GameState + Hände beider Spieler
 */
export interface GameStateWithHands {
  readonly gameState: GameState;
  readonly whiteHand: PlayerHand;
  readonly blackHand: PlayerHand;
}

/**
 * Game Controller
 * 
 * Zentrale API für UI.
 * Kapselt gesamte Game-Logik.
 */
export class GameController implements IGameController {
  private state: GameStateWithHands;
  
  constructor(
    gameConfig?: GameConfig,
    handConfig: HandConfig = DEFAULT_HAND_CONFIG
  ) {
    this.state = {
      gameState: createInitialGameState(gameConfig),
      whiteHand: HandManager.createEmpty(handConfig),
      blackHand: HandManager.createEmpty(handConfig),
    };
    
    // Initiale Zugkarten ziehen
    this.state = {
      ...this.state,
      whiteHand: HandManager.drawMoveCards(
        this.state.gameState,
        'white',
        this.state.whiteHand
      ),
    };
  }
  
  /**
   * Gibt View für einen Spieler zurück
   * 
   * WICHTIG: Spieler sieht nur seine eigene Hand!
   */
  public getPlayerView(player: Color): PlayerView {
    const myHand = player === 'white' ? this.state.whiteHand : this.state.blackHand;
    const opponentHand = player === 'white' ? this.state.blackHand : this.state.whiteHand;
    
    return {
      currentPlayer: this.state.gameState.currentPlayer,
      turnNumber: this.state.gameState.turnNumber,
      status: this.state.gameState.status,
      board: this.state.gameState.boardState.board,
      boardEffects: this.state.gameState.boardState.effects,
      myHand: {
        moveCards: myHand.moveCards,
        specialCards: myHand.specialCards,
        stats: HandManager.getStats(myHand),
      },
      opponentHandSize: opponentHand.moveCards.length + opponentHand.specialCards.length,
      canPlayCard: this.state.gameState.currentPlayer === player,
    };
  }
  
  /**
   * Spielt eine Karte aus
   * 
   * Zentrale Methode für UI.
   * Validiert & führt Karte aus.
   * 
   * @param player - Spieler der die Karte spielt
   * @param cardId - ID der Karte
   * @param params - Optionale Parameter (für Spezialkarten)
   * @param isMoveCard - Ist es eine Zugkarte? (default: true)
   */
  public playCardAction(
    player: Color,
    cardId: string,
    params: EffectParams = NO_PARAMS,
    isMoveCard: boolean = true
  ): ActionResult {
    // 1. Validiere: Ist Spieler am Zug?
    if (this.state.gameState.currentPlayer !== player) {
      return {
        success: false,
        message: 'Not your turn',
      };
    }
    
    // 2. Hole Karte aus Hand
    const hand = player === 'white' ? this.state.whiteHand : this.state.blackHand;
    const { newHand, playedCard } = HandManager.playCard(hand, cardId, isMoveCard);
    
    if (!playedCard) {
      return {
        success: false,
        message: 'Card not found in hand',
      };
    }
    
    // 3. Spiele Karte via Effect-Resolver
    const result = playCard(
      this.state.gameState,
      playedCard,
      params,
      player
    );
    
    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to play card',
      };
    }
    
    // 4. Update State
    this.state = {
      ...this.state,
      gameState: result.newState,
      whiteHand: player === 'white' ? newHand : this.state.whiteHand,
      blackHand: player === 'black' ? newHand : this.state.blackHand,
    };
    
    // 5. Bei Zugkarte: Zug-Wechsel-Logik
    if (isMoveCard) {
      this.handleTurnChange();
    }
    
    return {
      success: true,
      message: result.message || 'Card played successfully',
      newView: this.getPlayerView(player),
    };
  }
  
  /**
   * Zug-Wechsel Handler
   * 
   * - Alte Zugkarten entfernen
   * - Neue Zugkarten ziehen für nächsten Spieler
   */
  private handleTurnChange(): void {
    const currentPlayer = this.state.gameState.currentPlayer;
    
    // Entferne alte Zugkarten vom vorherigen Spieler
    const prevPlayer = currentPlayer === 'white' ? 'black' : 'white';
    const prevHand = prevPlayer === 'white' ? this.state.whiteHand : this.state.blackHand;
    const clearedHand = HandManager.clearMoveCards(prevHand);
    
    // Ziehe neue Zugkarten für aktuellen Spieler
    const currentHand = currentPlayer === 'white' ? this.state.whiteHand : this.state.blackHand;
    const newCurrentHand = HandManager.drawMoveCards(
      this.state.gameState,
      currentPlayer,
      currentHand
    );
    
    this.state = {
      ...this.state,
      whiteHand: currentPlayer === 'white' ? newCurrentHand : clearedHand,
      blackHand: currentPlayer === 'black' ? newCurrentHand : clearedHand,
    };
  }
  
  /**
   * Fügt Spezialkarte zur Hand hinzu
   * 
   * Wird z.B. beim Ziehen aus Deck verwendet.
   */
  public drawSpecialCard(player: Color, card: Card): ActionResult {
    const hand = player === 'white' ? this.state.whiteHand : this.state.blackHand;
    const newHand = HandManager.addSpecialCard(hand, card);
    
    if (newHand === hand) {
      return {
        success: false,
        message: 'Hand is full',
      };
    }
    
    this.state = {
      ...this.state,
      whiteHand: player === 'white' ? newHand : this.state.whiteHand,
      blackHand: player === 'black' ? newHand : this.state.blackHand,
    };
    
    return {
      success: true,
      message: `Drew ${card.name}`,
      newView: this.getPlayerView(player),
    };
  }
  
  /**
   * Debug: Zeige internen State
   * (Nur für Entwicklung)
   */
  public _debugGetState(): GameStateWithHands {
    return this.state;
  }
}
