/**
 * Deck Game Controller
 * 
 * Erweiterte Version des GameControllers mit Deckbuilding-System.
 * Jeder Spieler hat ein eigenes Deck mit Zieh-, Misch- und Ablagemechanik.
 * 
 * Features:
 * - Deck, Hand, Discard pro Spieler
 * - Karten ziehen aus Deck
 * - Automatisches Mischen
 * - Mulligan-Support
 * - Multiplayer-ready
 */

import { GameState, GameConfig, Color, createInitialGameState } from '../core/index.js';
import { Card } from './types/card.js';
import { EffectParams, NO_PARAMS } from './types/effect.js';
import { playCard } from './effects/effectResolver.js';
import {
  DeckState,
  DeckConfig,
  DEFAULT_DECK_CONFIG,
} from './deck/deckTypes.js';
import {
  drawCards,
  playCardFromDeck,
  discardCards,
  shuffleDeck,
  mulligan,
  getDeckStats,
} from './deck/deckManager.js';
import {
  buildDeckFromTemplate,
  STARTER_BALANCED,
} from './deck/deckBuilder.js';

/**
 * Vollständiger Spiel-Zustand mit Decks
 */
export interface GameStateWithDecks {
  readonly gameState: GameState;
  readonly whiteDeck: DeckState;
  readonly blackDeck: DeckState;
}

/**
 * Erweiterte Player View mit Deck-Info
 */
export interface DeckPlayerView {
  readonly currentPlayer: Color;
  readonly turnNumber: number;
  readonly status: string;
  
  // Hand
  readonly myHand: readonly Card[];
  readonly handSize: number;
  
  // Deck Stats
  readonly deckSize: number;
  readonly discardSize: number;
  
  // Opponent Info
  readonly opponentHandSize: number;
  readonly opponentDeckSize: number;
  readonly opponentDiscardSize: number;
  
  // Actions
  readonly canPlayCard: boolean;
  readonly canDraw: boolean;
}

/**
 * Ergebnis einer Aktion
 */
export interface DeckActionResult {
  readonly success: boolean;
  readonly message: string;
  readonly newView?: DeckPlayerView;
  readonly drawnCards?: readonly Card[];
}

/**
 * Deck Game Controller
 * 
 * Zentrale API für kartenbasiertes Schach mit Deckbuilding.
 */
export class DeckGameController {
  private state: GameStateWithDecks;
  private deckConfig: DeckConfig;
  
  constructor(
    gameConfig?: GameConfig,
    deckConfig: DeckConfig = DEFAULT_DECK_CONFIG,
    whiteDeckSetup?: DeckState,
    blackDeckSetup?: DeckState
  ) {
    this.deckConfig = deckConfig;
    
    // Erstelle initiales Game State
    const gameState = createInitialGameState(gameConfig);
    
    // Erstelle Decks (oder nutze vorgegebene)
    const whiteDeck = whiteDeckSetup || buildDeckFromTemplate(STARTER_BALANCED, 'white', deckConfig);
    const blackDeck = blackDeckSetup || buildDeckFromTemplate(STARTER_BALANCED, 'black', deckConfig);
    
    this.state = {
      gameState,
      whiteDeck,
      blackDeck,
    };
    
    // Initiale Karten ziehen
    this.drawInitialHands();
  }
  
  /**
   * Zieht initiale Karten für beide Spieler
   */
  private drawInitialHands(): void {
    const whiteDrawResult = drawCards(
      this.state.whiteDeck,
      this.deckConfig.initialDrawCount,
      this.deckConfig
    );
    
    const blackDrawResult = drawCards(
      this.state.blackDeck,
      this.deckConfig.initialDrawCount,
      this.deckConfig
    );
    
    this.state = {
      ...this.state,
      whiteDeck: whiteDrawResult.newState,
      blackDeck: blackDrawResult.newState,
    };
  }
  
  /**
   * Gibt View für einen Spieler zurück
   */
  public getPlayerView(player: Color): DeckPlayerView {
    const myDeck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    const opponentDeck = player === 'white' ? this.state.blackDeck : this.state.whiteDeck;
    
    const myStats = getDeckStats(myDeck);
    const opponentStats = getDeckStats(opponentDeck);
    
    return {
      currentPlayer: this.state.gameState.currentPlayer,
      turnNumber: this.state.gameState.turnNumber,
      status: this.state.gameState.status,
      
      myHand: myDeck.hand,
      handSize: myStats.handSize,
      
      deckSize: myStats.deckSize,
      discardSize: myStats.discardSize,
      
      opponentHandSize: opponentStats.handSize,
      opponentDeckSize: opponentStats.deckSize,
      opponentDiscardSize: opponentStats.discardSize,
      
      canPlayCard: this.state.gameState.currentPlayer === player && myStats.handSize > 0,
      canDraw: myStats.deckSize > 0 || (this.deckConfig.autoShuffleOnEmpty && myStats.discardSize > 0),
    };
  }
  
  /**
   * Zieht Karten vom Deck
   */
  public drawCardsAction(player: Color, count: number = 1): DeckActionResult {
    if (this.state.gameState.currentPlayer !== player) {
      return {
        success: false,
        message: 'Not your turn',
      };
    }
    
    const deck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    const drawResult = drawCards(deck, count, this.deckConfig);
    
    if (drawResult.failed) {
      return {
        success: false,
        message: drawResult.reason || 'Cannot draw cards',
      };
    }
    
    this.state = {
      ...this.state,
      whiteDeck: player === 'white' ? drawResult.newState : this.state.whiteDeck,
      blackDeck: player === 'black' ? drawResult.newState : this.state.blackDeck,
    };
    
    return {
      success: true,
      message: `Drew ${drawResult.drawnCards.length} card(s)${drawResult.shuffled ? ' (deck reshuffled)' : ''}`,
      drawnCards: drawResult.drawnCards,
      newView: this.getPlayerView(player),
    };
  }
  
  /**
   * Spielt eine Karte aus der Hand
   */
  public playCardAction(
    player: Color,
    cardIndex: number,
    params: EffectParams = NO_PARAMS
  ): DeckActionResult {
    // 1. Validierung
    if (this.state.gameState.currentPlayer !== player) {
      return {
        success: false,
        message: 'Not your turn',
      };
    }
    
    const deck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    
    if (cardIndex < 0 || cardIndex >= deck.hand.length) {
      return {
        success: false,
        message: 'Invalid card index',
      };
    }
    
    // 2. Karte von Hand entfernen
    const { newState: deckAfterPlay, playedCard } = playCardFromDeck(deck, cardIndex);
    
    if (!playedCard) {
      return {
        success: false,
        message: 'Failed to play card',
      };
    }
    
    // 3. Karten-Effekt anwenden
    const effectResult = playCard(
      this.state.gameState,
      playedCard,
      params,
      player
    );
    
    if (!effectResult.success) {
      return {
        success: false,
        message: effectResult.message || 'Card effect failed',
      };
    }
    
    // 4. State aktualisieren
    this.state = {
      ...this.state,
      gameState: effectResult.newState,
      whiteDeck: player === 'white' ? deckAfterPlay : this.state.whiteDeck,
      blackDeck: player === 'black' ? deckAfterPlay : this.state.blackDeck,
    };
    
    // 5. Automatisches Ziehen am Rundenende (optional)
    if (this.deckConfig.drawPerTurn > 0) {
      const newPlayer = this.state.gameState.currentPlayer;
      if (newPlayer !== player) {
        // Zug hat gewechselt, neuer Spieler zieht
        this.drawCardsForPlayer(newPlayer, this.deckConfig.drawPerTurn);
      }
    }
    
    return {
      success: true,
      message: `Played ${playedCard.name}`,
      newView: this.getPlayerView(player),
    };
  }
  
  /**
   * Hilfsfunktion: Automatisches Ziehen für Spieler
   */
  private drawCardsForPlayer(player: Color, count: number): void {
    const deck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    const drawResult = drawCards(deck, count, this.deckConfig);
    
    this.state = {
      ...this.state,
      whiteDeck: player === 'white' ? drawResult.newState : this.state.whiteDeck,
      blackDeck: player === 'black' ? drawResult.newState : this.state.blackDeck,
    };
  }
  
  /**
   * Wirft Karten von der Hand ab
   */
  public discardCardsAction(
    player: Color,
    cardIndices: readonly number[]
  ): DeckActionResult {
    const deck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    const discardResult = discardCards(deck, cardIndices);
    
    if (!discardResult.success) {
      return {
        success: false,
        message: 'Failed to discard cards',
      };
    }
    
    this.state = {
      ...this.state,
      whiteDeck: player === 'white' ? discardResult.newState : this.state.whiteDeck,
      blackDeck: player === 'black' ? discardResult.newState : this.state.blackDeck,
    };
    
    return {
      success: true,
      message: `Discarded ${discardResult.discardedCards.length} card(s)`,
      newView: this.getPlayerView(player),
    };
  }
  
  /**
   * Mischt das Deck
   */
  public shuffleDeckAction(
    player: Color,
    source: 'deck' | 'discard' | 'both' = 'discard'
  ): DeckActionResult {
    const deck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    const shuffleResult = shuffleDeck(deck, source);
    
    this.state = {
      ...this.state,
      whiteDeck: player === 'white' ? shuffleResult.newState : this.state.whiteDeck,
      blackDeck: player === 'black' ? shuffleResult.newState : this.state.blackDeck,
    };
    
    return {
      success: true,
      message: `Shuffled ${shuffleResult.cardCount} cards from ${shuffleResult.source}`,
      newView: this.getPlayerView(player),
    };
  }
  
  /**
   * Mulligan: Hand zurück und neu ziehen
   */
  public mulliganAction(player: Color): DeckActionResult {
    if (!this.deckConfig.allowMulligan) {
      return {
        success: false,
        message: 'Mulligan not allowed',
      };
    }
    
    const deck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    const mulliganResult = mulligan(deck, this.deckConfig);
    
    if (mulliganResult.failed) {
      return {
        success: false,
        message: mulliganResult.reason || 'Mulligan failed',
      };
    }
    
    this.state = {
      ...this.state,
      whiteDeck: player === 'white' ? mulliganResult.newState : this.state.whiteDeck,
      blackDeck: player === 'black' ? mulliganResult.newState : this.state.blackDeck,
    };
    
    return {
      success: true,
      message: 'Mulligan successful',
      newView: this.getPlayerView(player),
    };
  }
  
  /**
   * Gibt Deck-Statistiken für einen Spieler zurück
   */
  public getDeckStatsAction(player: Color) {
    const deck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    return getDeckStats(deck);
  }
  
  /**
   * Debug: Zeige internen State
   */
  public _debugGetState(): GameStateWithDecks {
    return this.state;
  }
}
