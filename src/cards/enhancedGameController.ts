/**
 * Enhanced Game Controller
 * 
 * Extends GameController with deck-building support:
 * - Each player has a custom special card deck
 * - Hand management: up to 5 move cards + 1 special card
 * - Special card lifecycle: keep or shuffle back at turn end
 */

import { GameState, GameConfig, Color, createInitialGameState, Move, applyMove, generatePieceMoves, Position } from '../core/index.js';
import { isCheckmate, isStalemate, wouldExposeKing } from '../core/moves/moveValidator.js';
import { Card, EffectParams, NO_PARAMS } from './types/index.js';
import { playCard } from './effects/effectResolver.js';
import {
  HandManager,
  PlayerHand,
  HandConfig,
  DEFAULT_HAND_CONFIG,
} from './moveCards/handManagerV2.js';
import { generateMoveCards } from './moveCards/moveCardGenerator.js';
import { IGameController, PlayerView, ActionResult } from './gameController/IGameController.js';

/**
 * Simple deck state for special cards
 */
export interface SpecialCardDeck {
  readonly deck: readonly Card[];       // Cards in deck
  readonly used: readonly Card[];       // Cards that have been played
}

/**
 * Vollständiger Spiel-Zustand mit Decks
 */
export interface EnhancedGameState {
  readonly gameState: GameState;
  readonly whiteHand: PlayerHand;
  readonly blackHand: PlayerHand;
  readonly whiteDeck: SpecialCardDeck;
  readonly blackDeck: SpecialCardDeck;
  readonly pendingSpecialCardDecision: {
    player: Color;
    card: Card;
  } | null;  // Pending decision for current special card
  readonly whiteDrawModifier: number;  // Temporary modifier to draw count
  readonly blackDrawModifier: number;
  readonly skipNextTurn: Color | null;  // Which player should skip their next turn
  readonly skipTurnAfterNext: Color | null;  // Which player should skip after one turn (Time Warp)
  readonly freeMoveEnabled: Color | null;  // Which player has free move enabled this turn
  readonly whiteFocusedPieceType: string | null;  // Which piece type white should draw moves for
  readonly blackFocusedPieceType: string | null;  // Which piece type black should draw moves for
  readonly pendingPieceTypeChoice: {  // Awaiting piece type choice for Focus Strategy
    player: Color;
    cardId: string;
  } | null;
  readonly pendingCardSelection: {  // Awaiting card selection from used pile
    player: Color;
    action: 'recover' | 'activate';
    maxCount: number;  // Max number of cards to select (2 for recover, 1 for activate)
    triggeringCardId: string;  // The card that triggered this selection (to exclude from selection)
  } | null;
  readonly pendingBoardAction: {  // Awaiting board position selection
    player: Color;
    action: 'swapPieces' | 'placeTrap' | 'convertPawn';
    cardId: string;
  } | null;
  readonly playHistory: readonly {
    player: Color;
    card: Card;
    turnNumber: number;
    isMoveCard: boolean;
  }[];  // History of all cards played
}

/**
 * Create empty deck
 */
function createEmptyDeck(): SpecialCardDeck {
  return {
    deck: [],
    used: [],
  };
}

/**
 * Create deck from cards
 */
function createDeckFromCards(cards: readonly Card[]): SpecialCardDeck {
  // Shuffle cards
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return {
    deck: shuffled,
    used: [],
  };
}

/**
 * Draw card from deck
 */
function drawFromDeck(deck: SpecialCardDeck): { newDeck: SpecialCardDeck; drawnCard: Card | null } {
  if (deck.deck.length === 0) {
    // Deck is empty - no reshuffling from used pile
    return { newDeck: deck, drawnCard: null };
  }
  
  const [drawnCard, ...remaining] = deck.deck;
  return {
    newDeck: {
      ...deck,
      deck: remaining,
    },
    drawnCard: drawnCard || null,
  };
}

/**
 * Add card to used pile
 */
function addToUsed(deck: SpecialCardDeck, card: Card): SpecialCardDeck {
  return {
    ...deck,
    used: [...deck.used, card],
  };
}

/**
 * Shuffle card back into deck
 */
function shuffleCardBack(deck: SpecialCardDeck, card: Card): SpecialCardDeck {
  const newDeck = [...deck.deck, card].sort(() => Math.random() - 0.5);
  return {
    ...deck,
    deck: newDeck,
  };
}

/**
 * Enhanced Game Controller with Deck Building
 */
export class EnhancedGameController implements IGameController {
  private state: EnhancedGameState;
  
  constructor(
    gameConfig?: GameConfig,
    _handConfig: HandConfig = DEFAULT_HAND_CONFIG,
    whiteDeck?: readonly Card[],
    blackDeck?: readonly Card[]
  ) {
    
    this.state = {
      gameState: createInitialGameState(gameConfig),
      whiteHand: HandManager.createEmpty(_handConfig),
      blackHand: HandManager.createEmpty(_handConfig),
      whiteDeck: whiteDeck ? createDeckFromCards(whiteDeck) : createEmptyDeck(),
      blackDeck: blackDeck ? createDeckFromCards(blackDeck) : createEmptyDeck(),
      pendingSpecialCardDecision: null,
      whiteDrawModifier: 0,
      blackDrawModifier: 0,
      skipNextTurn: null,
      skipTurnAfterNext: null,
      freeMoveEnabled: null,
      whiteFocusedPieceType: null,
      blackFocusedPieceType: null,
      pendingPieceTypeChoice: null,
      pendingCardSelection: null,
      pendingBoardAction: null,
      playHistory: [],
    };
    
    // Draw initial cards
    this.drawInitialCards();
  }
  
  /**
   * Draw initial cards for white player
   */
  private drawInitialCards(): void {
    // Draw move cards for white (starting player)
    this.state = {
      ...this.state,
      whiteHand: HandManager.drawMoveCards(
        this.state.gameState,
        'white',
        this.state.whiteHand
      ),
    };
    
    // Draw special card for white
    const { newDeck, drawnCard } = drawFromDeck(this.state.whiteDeck);
    if (drawnCard) {
      this.state = {
        ...this.state,
        whiteDeck: newDeck,
        whiteHand: HandManager.addSpecialCard(this.state.whiteHand, drawnCard),
      };
    }
  }
  
  /**
   * Get player view
   */
  public getPlayerView(player: Color): PlayerView {
    const myHand = player === 'white' ? this.state.whiteHand : this.state.blackHand;
    const opponentHand = player === 'white' ? this.state.blackHand : this.state.whiteHand;
    const myDeck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    
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
      deckSize: myDeck.deck.length,
      discardSize: myDeck.used.length,
      freeMoveEnabled: this.state.freeMoveEnabled === player,
      pendingPieceTypeChoice: this.hasPendingPieceTypeChoice(player),
      pendingCardSelection: this.getPendingCardSelection(player),
      pendingBoardAction: this.getPendingBoardAction(player),
    };
  }
  
  /**
   * Check if there's a pending special card decision
   */
  public hasPendingSpecialCardDecision(player: Color): boolean {
    return this.state.pendingSpecialCardDecision != null && 
           this.state.pendingSpecialCardDecision.player === player;
  }
  
  /**
   * Get the pending special card
   */
  public getPendingSpecialCard(player: Color): Card | null {
    if (this.hasPendingSpecialCardDecision(player)) {
      return this.state.pendingSpecialCardDecision!.card;
    }
    return null;
  }
  
  /**
   * Handle special card decision: keep or shuffle back
   */
  public handleSpecialCardDecision(player: Color, keepCard: boolean): ActionResult {
    if (!this.hasPendingSpecialCardDecision(player)) {
      return {
        success: false,
        message: 'No pending special card decision',
      };
    }
    
    const { card } = this.state.pendingSpecialCardDecision!;
    const deck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    const hand = player === 'white' ? this.state.whiteHand : this.state.blackHand;
    
    let newDeck = deck;
    let newHand = hand;
    
    if (keepCard) {
      // Keep card - add it back to hand for next turn
      newHand = {
        ...hand,
        specialCards: [...hand.specialCards, card],
      };
    } else {
      // Shuffle back into deck
      newDeck = shuffleCardBack(deck, card);
    }
    
    // Clear pending decision and update deck/hand
    this.state = {
      ...this.state,
      whiteDeck: player === 'white' ? newDeck : this.state.whiteDeck,
      blackDeck: player === 'black' ? newDeck : this.state.blackDeck,
      whiteHand: player === 'white' ? newHand : this.state.whiteHand,
      blackHand: player === 'black' ? newHand : this.state.blackHand,
      pendingSpecialCardDecision: null,
    };
    
    // Continue with turn change (skip decision check since we just handled it)
    this.completeTurnChange(true);
    
    return {
      success: true,
      message: keepCard ? 'Card kept for this turn' : 'Card shuffled back into deck',
      newView: this.getPlayerView(player),
    };
  }
  
  /**
   * Play card action
   */
  public playCardAction(
    player: Color,
    cardId: string,
    params: EffectParams = NO_PARAMS,
    isMoveCard: boolean = true
  ): ActionResult {
    // Validate: Is it player's turn?
    if (this.state.gameState.currentPlayer !== player) {
      return {
        success: false,
        message: 'Not your turn',
      };
    }
    
    // Get card from hand
    const hand = player === 'white' ? this.state.whiteHand : this.state.blackHand;
    const { newHand, playedCard } = HandManager.playCard(hand, cardId, isMoveCard);
    
    if (!playedCard) {
      return {
        success: false,
        message: 'Card not found in hand',
      };
    }
    
    // Play card via effect resolver
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
    
    // Update state
    this.state = {
      ...this.state,
      gameState: result.newState,
      whiteHand: player === 'white' ? newHand : this.state.whiteHand,
      blackHand: player === 'black' ? newHand : this.state.blackHand,
      // Only add special cards to used pile, not move cards
      whiteDeck: player === 'white' && !isMoveCard ? addToUsed(this.state.whiteDeck, playedCard) : this.state.whiteDeck,
      blackDeck: player === 'black' && !isMoveCard ? addToUsed(this.state.blackDeck, playedCard) : this.state.blackDeck,
      playHistory: [
        ...this.state.playHistory,
        {
          player,
          card: playedCard,
          turnNumber: this.state.gameState.turnNumber,
          isMoveCard,
        },
      ],
    };
    
    // Check for game over after playing card
    this.checkGameOver();
    if (this.state.gameState.status === 'checkmate' || 
        this.state.gameState.status === 'stalemate' ||
        this.state.gameState.status === 'draw') {
      return {
        success: true,
        message: 'Game over',
        newView: this.getPlayerView(player),
      };
    }
    
    // Handle metadata actions from effect
    if (result.metadata) {
      this.handleEffectMetadata(result.metadata, player);
      
      // Check if this is Focus Strategy - needs piece type choice
      if (result.metadata.action === 'focusStrategy') {
        this.state = {
          ...this.state,
          pendingPieceTypeChoice: {
            player,
            cardId,
          },
        };
        
        return {
          success: true,
          message: 'Choose a piece type for next turn',
          newView: this.getPlayerView(player),
        };
      }
      
      // Check if this is Salvage or Recall - needs card selection from used pile
      if (result.metadata.action === 'recoverCards') {
        return {
          success: true,
          message: 'Select cards from used pile to recover',
          newView: this.getPlayerView(player),
        };
      }
      
      if (result.metadata.action === 'activateUsedCard') {
        return {
          success: true,
          message: 'Select a card from used pile to activate',
          newView: this.getPlayerView(player),
        };
      }
      
      // Check if this needs board interaction (Tactical Reposition, Trap Field, Conversion)
      if (result.metadata.action === 'swapPieces') {
        this.state = {
          ...this.state,
          pendingBoardAction: {
            player,
            action: 'swapPieces',
            cardId: result.metadata.cardId as string,
          },
        };
        return {
          success: true,
          message: 'Select two of your pieces to swap',
          newView: this.getPlayerView(player),
        };
      }
      
      if (result.metadata.action === 'placeTrap') {
        this.state = {
          ...this.state,
          pendingBoardAction: {
            player,
            action: 'placeTrap',
            cardId: result.metadata.cardId as string,
          },
        };
        return {
          success: true,
          message: 'Select an empty square to place trap',
          newView: this.getPlayerView(player),
        };
      }
      
      if (result.metadata.action === 'convertPawn') {
        this.state = {
          ...this.state,
          pendingBoardAction: {
            player,
            action: 'convertPawn',
            cardId: result.metadata.cardId as string,
          },
        };
        return {
          success: true,
          message: 'Select an opponent pawn to convert',
          newView: this.getPlayerView(player),
        };
      }
    }
    
    // Determine if turn should end
    if (isMoveCard) {
      // Move cards always initiate turn change (check for special cards)
      this.initiateTurnChange();
    } else if (this.shouldSpecialCardEndTurn(result.metadata)) {
      // Special cards that end turn need to switch player first, then complete turn change
      // (Move cards already switch player in applyMove, but special cards don't)
      const nextPlayer: Color = player === 'white' ? 'black' : 'white';
      this.state = {
        ...this.state,
        gameState: {
          ...this.state.gameState,
          currentPlayer: nextPlayer,
          turnNumber: this.state.gameState.turnNumber + 1,
        },
      };
      this.completeTurnChange();
    }
    
    return {
      success: true,
      message: result.message || 'Card played successfully',
      newView: this.getPlayerView(player),
    };
  }
  
  /**
   * Check if a special card should end the turn
   * Cards that modify the current player's hand (draw, reroll, freeMove) don't end the turn
   * Cards that affect the board or opponent do end the turn
   */
  private shouldSpecialCardEndTurn(metadata?: Record<string, unknown>): boolean {
    if (!metadata || !metadata.action) {
      // No metadata or action - card affects board directly, end turn
      return true;
    }
    
    const action = metadata.action as string;
    
    // Actions that allow continuing the turn (require further player input or modify player's own state)
    const continueActions = ['drawCard', 'rerollMoves', 'drawExtraMoves', 'freeMove', 'focusStrategy', 'opponentDrawLess', 'skipTurn', 'doubleTurn', 'stealCard'];
    
    if (continueActions.includes(action)) {
      return false; // Don't end turn, let player continue
    }
    
    // All other actions end the turn
    return true;
  }
  
  /**
   * Handle metadata actions returned by effects
   */
  private handleEffectMetadata(metadata: Record<string, unknown>, player: Color): void {
    const action = metadata.action as string;
    
    switch (action) {
      case 'drawCard': {
        // Draw special card from deck
        const count = (metadata.count as number) || 1;
        const deck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
        const hand = player === 'white' ? this.state.whiteHand : this.state.blackHand;
        
        let currentDeck = deck;
        let currentHand = hand;
        
        for (let i = 0; i < count; i++) {
          const { newDeck, drawnCard } = drawFromDeck(currentDeck);
          if (drawnCard) {
            currentHand = HandManager.addSpecialCard(currentHand, drawnCard);
            currentDeck = newDeck;
          }
        }
        
        this.state = {
          ...this.state,
          whiteHand: player === 'white' ? currentHand : this.state.whiteHand,
          blackHand: player === 'black' ? currentHand : this.state.blackHand,
          whiteDeck: player === 'white' ? currentDeck : this.state.whiteDeck,
          blackDeck: player === 'black' ? currentDeck : this.state.blackDeck,
        };
        break;
      }
      
      case 'rerollMoves': {
        // Clear current move cards and draw new ones
        const hand = player === 'white' ? this.state.whiteHand : this.state.blackHand;
        const clearedHand = HandManager.clearMoveCards(hand);
        const newHand = HandManager.drawMoveCards(
          this.state.gameState,
          player,
          clearedHand
        );
        
        this.state = {
          ...this.state,
          whiteHand: player === 'white' ? newHand : this.state.whiteHand,
          blackHand: player === 'black' ? newHand : this.state.blackHand,
        };
        break;
      }
      
      case 'drawExtraMoves': {
        // Draw additional move cards (beyond normal max)
        const count = (metadata.count as number) || 3;
        const hand = player === 'white' ? this.state.whiteHand : this.state.blackHand;
        
        // Temporarily increase draw limit
        const tempHand = {
          ...hand,
          config: {
            ...hand.config,
            drawMoveCardsPerTurn: count,
          },
        };
        
        // Draw with ignoreMax=true to allow going beyond 5 cards
        const newHand = HandManager.drawMoveCards(
          this.state.gameState,
          player,
          tempHand,
          true  // Ignore max limit
        );
        
        // Restore original config
        const finalHand = {
          ...newHand,
          config: hand.config,
        };
        
        this.state = {
          ...this.state,
          whiteHand: player === 'white' ? finalHand : this.state.whiteHand,
          blackHand: player === 'black' ? finalHand : this.state.blackHand,
        };
        break;
      }
      
      case 'opponentDrawLess': {
        // Opponent draws fewer cards next turn
        const reduction = (metadata.reduction as number) || 1;
        const opponent = player === 'white' ? 'black' : 'white';
        
        this.state = {
          ...this.state,
          whiteDrawModifier: opponent === 'white' ? -reduction : this.state.whiteDrawModifier,
          blackDrawModifier: opponent === 'black' ? -reduction : this.state.blackDrawModifier,
        };
        break;
      }
      
      case 'restrictMoves': {
        // Opponent gets fewer move cards next turn
        const reduction = (metadata.reduction as number) || 2;
        const opponent = player === 'white' ? 'black' : 'white';
        
        this.state = {
          ...this.state,
          whiteDrawModifier: opponent === 'white' ? -reduction : this.state.whiteDrawModifier,
          blackDrawModifier: opponent === 'black' ? -reduction : this.state.blackDrawModifier,
        };
        break;
      }
      
      case 'skipTurn': {
        // Opponent skips their next turn
        const opponent = player === 'white' ? 'black' : 'white';
        
        this.state = {
          ...this.state,
          skipNextTurn: opponent,
        };
        break;
      }
      
      case 'doubleTurn': {
        // Player gets two turns after opponent takes one turn
        const opponent = player === 'white' ? 'black' : 'white';
        
        this.state = {
          ...this.state,
          skipTurnAfterNext: opponent,
        };
        break;
      }
      
      case 'freeMove': {
        // Enable free move for current player this turn
        this.state = {
          ...this.state,
          freeMoveEnabled: player,
        };
        break;
      }
      
      case 'focusStrategy': {
        // Player needs to choose a piece type for next turn
        // This doesn't modify state directly - it requires player input
        // The UI will prompt for piece type choice
        break;
      }
      
      case 'recoverCards': {
        // Player needs to select cards from used pile to recover
        const count = (metadata.count as number) || 2;
        const triggeringCardId = (metadata.triggeringCardId as string) || '';
        this.state = {
          ...this.state,
          pendingCardSelection: {
            player,
            action: 'recover',
            maxCount: count,
            triggeringCardId,
          },
        };
        break;
      }
      
      case 'activateUsedCard': {
        // Player needs to select a card from used pile to activate
        const triggeringCardId = (metadata.triggeringCardId as string) || '';
        this.state = {
          ...this.state,
          pendingCardSelection: {
            player,
            action: 'activate',
            maxCount: 1,
            triggeringCardId,
          },
        };
        break;
      }
      
      case 'stealCard': {
        // Draw a random card from opponent's deck
        const opponent: Color = player === 'white' ? 'black' : 'white';
        const opponentDeck = opponent === 'white' ? this.state.whiteDeck : this.state.blackDeck;
        const playerHand = player === 'white' ? this.state.whiteHand : this.state.blackHand;
        
        // Draw from opponent's deck
        const { newDeck: updatedOpponentDeck, drawnCard } = drawFromDeck(opponentDeck);
        
        if (drawnCard) {
          // Add stolen card to player's hand
          const updatedPlayerHand = HandManager.addSpecialCard(playerHand, drawnCard);
          
          this.state = {
            ...this.state,
            whiteHand: player === 'white' ? updatedPlayerHand : this.state.whiteHand,
            blackHand: player === 'black' ? updatedPlayerHand : this.state.blackHand,
            whiteDeck: opponent === 'white' ? updatedOpponentDeck : this.state.whiteDeck,
            blackDeck: opponent === 'black' ? updatedOpponentDeck : this.state.blackDeck,
          };
        }
        // If opponent's deck is empty, nothing happens
        break;
      }
      
      // Add more cases as needed
      default:
        // Unknown action - ignore
        break;
    }
  }
  
  /**
   * Check for game over conditions and update game status
   */
  private checkGameOver(): void {
    const currentState = this.state.gameState;
    
    // Skip if game is already over
    if (currentState.status === 'checkmate' || 
        currentState.status === 'stalemate' ||
        currentState.status === 'draw' ||
        currentState.status === 'resigned') {
      return;
    }
    
    const currentPlayer = currentState.currentPlayer;
    
    // Check for checkmate
    if (isCheckmate(currentState.boardState.board, currentPlayer)) {
      this.state = {
        ...this.state,
        gameState: {
          ...currentState,
          status: 'checkmate',
        },
      };
      return;
    }
    
    // Check for stalemate
    if (isStalemate(currentState.boardState.board, currentPlayer)) {
      this.state = {
        ...this.state,
        gameState: {
          ...currentState,
          status: 'stalemate',
        },
      };
      return;
    }
    
    // Check for 50-move rule draw
    if (currentState.halfMoveClock >= 100) {
      this.state = {
        ...this.state,
        gameState: {
          ...currentState,
          status: 'draw',
        },
      };
      return;
    }
  }
  
  /**
   * Initiate turn change
   */
  private initiateTurnChange(): void {
    // Complete turn change immediately (decision happens at start of next turn)
    this.completeTurnChange(false);
  }
  
  /**
   * Complete turn change after special card decision
   * @param skipDecisionCheck - Skip the special card decision check (used after handling a decision)
   */
  private completeTurnChange(skipDecisionCheck: boolean = false): void {
    const currentPlayer = this.state.gameState.currentPlayer;
    
    // Check for game over conditions before processing turn
    this.checkGameOver();
    if (this.state.gameState.status === 'checkmate' || 
        this.state.gameState.status === 'stalemate' ||
        this.state.gameState.status === 'draw') {
      return;  // Don't process turn change if game is over
    }
    
    // FIRST: Check if current player should skip their turn (before showing any dialogs)
    if (this.state.skipNextTurn === currentPlayer) {
      // Skip this player's turn - switch back to opponent without drawing cards
      const opponent: Color = currentPlayer === 'white' ? 'black' : 'white';
      
      // Switch the player in game state
      const newGameState: GameState = {
        ...this.state.gameState,
        currentPlayer: opponent,
        turnNumber: this.state.gameState.turnNumber + 1,
      };
      
      this.state = {
        ...this.state,
        gameState: newGameState,
        skipNextTurn: null,
      };
      
      // Now continue with the opponent's turn (recursive call, check for decisions)
      this.completeTurnChange(false);
      return;
    }
    
    // SECOND: At the start of this player's actual turn, check if they have an unused special card from last turn
    // Skip this check if we just handled a decision
    const currentHand = currentPlayer === 'white' ? this.state.whiteHand : this.state.blackHand;
    if (!skipDecisionCheck && currentHand.specialCards.length > 0) {
      const unusedSpecialCard = currentHand.specialCards[0];
      
      // Set pending decision for current player
      this.state = {
        ...this.state,
        pendingSpecialCardDecision: {
          player: currentPlayer,
          card: unusedSpecialCard,
        },
        // Clear the special card from hand temporarily
        whiteHand: currentPlayer === 'white' 
          ? HandManager.clearSpecialCards(this.state.whiteHand)
          : this.state.whiteHand,
        blackHand: currentPlayer === 'black'
          ? HandManager.clearSpecialCards(this.state.blackHand)
          : this.state.blackHand,
      };
      
      // Don't continue - wait for player decision
      return;
    }
    
    // Check if skipTurnAfterNext should activate now
    if (this.state.skipTurnAfterNext === currentPlayer) {
      // Activate skipNextTurn for this player after this turn
      this.state = {
        ...this.state,
        skipNextTurn: currentPlayer,
        skipTurnAfterNext: null,
      };
    }
    
    // Clear move cards from previous player
    const prevPlayer = currentPlayer === 'white' ? 'black' : 'white';
    const prevHand = prevPlayer === 'white' ? this.state.whiteHand : this.state.blackHand;
    const clearedPrevHand = HandManager.clearMoveCards(prevHand);
    
    // Get draw modifier for current player
    const drawModifier = currentPlayer === 'white' ? this.state.whiteDrawModifier : this.state.blackDrawModifier;
    
    // Get focused piece type for current player
    const focusedPieceType = currentPlayer === 'white' ? this.state.whiteFocusedPieceType : this.state.blackFocusedPieceType;
    
    // Draw new move cards for current player (with modifier and focus filter)
    // Re-fetch hand after potential state changes
    const handForDrawing = currentPlayer === 'white' ? this.state.whiteHand : this.state.blackHand;
    
    // Apply draw modifier by adjusting the config temporarily
    const modifiedConfig = {
      ...handForDrawing.config,
      drawMoveCardsPerTurn: Math.max(1, handForDrawing.config.drawMoveCardsPerTurn + drawModifier),
    };
    
    const tempHand = {
      ...handForDrawing,
      config: modifiedConfig,
    };
    
    let handWithMoveCards: PlayerHand;
    
    if (focusedPieceType) {
      // Generate all move cards, then filter by focused piece type
      const allMoveCards = generateMoveCards(this.state.gameState.boardState, currentPlayer);
      const filteredCards = allMoveCards.filter(card => {
        // Card names start with piece type (e.g., "Pawn a2 → a3")
        const pieceName = focusedPieceType.charAt(0).toUpperCase() + focusedPieceType.slice(1);
        return card.name.startsWith(pieceName);
      });
      
      const drawCount = modifiedConfig.drawMoveCardsPerTurn;
      
      // Shuffle and take focused cards first
      const shuffledFiltered = [...filteredCards].sort(() => Math.random() - 0.5);
      const focusedDraw = shuffledFiltered.slice(0, drawCount);
      
      // If we don't have enough focused cards, fill with random moves
      let finalDraw = focusedDraw;
      if (focusedDraw.length < drawCount) {
        const remaining = drawCount - focusedDraw.length;
        
        // Get cards that aren't already in focusedDraw
        const otherCards = allMoveCards.filter(card => 
          !focusedDraw.some(fc => fc.id === card.id)
        );
        
        // Shuffle and take remaining from other cards
        const shuffledOther = [...otherCards].sort(() => Math.random() - 0.5);
        const randomDraw = shuffledOther.slice(0, remaining);
        
        finalDraw = [...focusedDraw, ...randomDraw];
      }
      
      handWithMoveCards = {
        ...tempHand,
        moveCards: [...tempHand.moveCards, ...finalDraw],
      };
    } else {
      // Normal draw without filter
      handWithMoveCards = HandManager.drawMoveCards(
        this.state.gameState,
        currentPlayer,
        tempHand
      );
    }
    
    // Restore original config
    const restoredHand = {
      ...handWithMoveCards,
      config: handForDrawing.config,
    };
    
    // Draw special card for current player (if slot is empty)
    let finalCurrentHand = restoredHand;
    let currentDeck = currentPlayer === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    
    if (restoredHand.specialCards.length === 0) {
      const { newDeck, drawnCard } = drawFromDeck(currentDeck);
      if (drawnCard) {
        finalCurrentHand = HandManager.addSpecialCard(restoredHand, drawnCard);
        currentDeck = newDeck;
      }
    }
    
    // Update state and reset draw modifiers
    this.state = {
      ...this.state,
      whiteHand: currentPlayer === 'white' ? finalCurrentHand : clearedPrevHand,
      blackHand: currentPlayer === 'black' ? finalCurrentHand : clearedPrevHand,
      whiteDeck: currentPlayer === 'white' ? currentDeck : this.state.whiteDeck,
      blackDeck: currentPlayer === 'black' ? currentDeck : this.state.blackDeck,
      // Reset draw modifier after using it
      whiteDrawModifier: currentPlayer === 'white' ? 0 : this.state.whiteDrawModifier,
      blackDrawModifier: currentPlayer === 'black' ? 0 : this.state.blackDrawModifier,
      // Clear free move flag (it's only for one turn)
      freeMoveEnabled: null,
      // Clear focused piece type after using it
      whiteFocusedPieceType: currentPlayer === 'white' ? null : this.state.whiteFocusedPieceType,
      blackFocusedPieceType: currentPlayer === 'black' ? null : this.state.blackFocusedPieceType,
    };
  }
  
  /**
   * Draw special card (legacy method for compatibility)
   */
  public drawSpecialCard(player: Color, card: Card): ActionResult {
    const hand = player === 'white' ? this.state.whiteHand : this.state.blackHand;
    const newHand = HandManager.addSpecialCard(hand, card);
    
    if (newHand === hand) {
      return {
        success: false,
        message: 'Special card hand is full',
      };
    }
    
    this.state = {
      ...this.state,
      whiteHand: player === 'white' ? newHand : this.state.whiteHand,
      blackHand: player === 'black' ? newHand : this.state.blackHand,
    };
    
    return {
      success: true,
      message: 'Special card added to hand',
      newView: this.getPlayerView(player),
    };
  }
  
  /**
   * Get available moves for a piece at given position
   * Only works when free move is enabled for the player
   */
  public getAvailableMovesForPiece(player: Color, from: Position): Position[] {
    // Check if free move is enabled for this player
    if (this.state.freeMoveEnabled !== player) {
      return [];
    }
    
    // Check if it's the player's turn
    if (this.state.gameState.currentPlayer !== player) {
      return [];
    }
    
    // Generate all pseudo-legal moves for the piece at this position
    const board = this.state.gameState.boardState.board;
    const allMoves = generatePieceMoves(
      board,
      from,
      this.state.gameState.boardState
    );
    
    // Filter out moves that would leave king in check
    return allMoves.filter(to => !wouldExposeKing(board, from, to, player));
  }
  
  /**
   * Make a free move (when free move card is active)
   */
  public makeFreeMove(player: Color, move: Move): ActionResult {
    // Validate that free move is enabled
    if (this.state.freeMoveEnabled !== player) {
      return {
        success: false,
        message: 'Free move is not enabled',
      };
    }
    
    // Validate it's the player's turn
    if (this.state.gameState.currentPlayer !== player) {
      return {
        success: false,
        message: 'Not your turn',
      };
    }
    
    // Apply the move
    const newGameState = applyMove(this.state.gameState, move);
    
    // Update state and clear free move flag
    this.state = {
      ...this.state,
      gameState: newGameState,
      freeMoveEnabled: null,  // Free move used up
    };
    
    // Check for game over after move
    this.checkGameOver();
    
    // If game over, don't process turn change
    if (this.state.gameState.status === 'checkmate' || 
        this.state.gameState.status === 'stalemate' ||
        this.state.gameState.status === 'draw') {
      return {
        success: true,
        message: 'Game over',
        newView: this.getPlayerView(player),
      };
    }
    
    // Check if player has special card to handle at end of turn
    const currentHand = player === 'white' ? this.state.whiteHand : this.state.blackHand;
    if (currentHand.specialCards.length > 0 && !this.hasPendingSpecialCardDecision(player)) {
      const specialCard = currentHand.specialCards[0];
      this.state = {
        ...this.state,
        pendingSpecialCardDecision: {
          player,
          card: specialCard,
        },
      };
    } else {
      // No special card, complete turn change
      this.completeTurnChange();
    }
    
    return {
      success: true,
      message: 'Free move executed',
    };
  }

  /**
   * Get all pawns that can move backwards for a player
   */
  public getRetreatatablePawns(player: Color): Position[] {
    const retreatablePawns: Position[] = [];
    const board = this.state.gameState.boardState.board;
    const backwardDirection = player === 'white' ? -1 : 1;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'pawn' && piece.color === player) {
          const backwardRow = row + backwardDirection;
          
          // Check if backward position is on the board and empty
          if (backwardRow >= 0 && backwardRow < 8) {
            const backwardPiece = board[backwardRow][col];
            if (!backwardPiece) {
              retreatablePawns.push({ row, col });
            }
          }
        }
      }
    }
    
    return retreatablePawns;
  }
  
  /**
   * Get the backwards position for a pawn
   */
  public getBackwardPosition(player: Color, pawnPos: Position): Position {
    const backwardDirection = player === 'white' ? -1 : 1;
    return {
      row: pawnPos.row + backwardDirection,
      col: pawnPos.col,
    };
  }

  /**
   * Choose a piece type for Focus Strategy card
   */
  public choosePieceType(player: Color, pieceType: string): ActionResult {
    if (!this.state.pendingPieceTypeChoice || this.state.pendingPieceTypeChoice.player !== player) {
      return {
        success: false,
        message: 'No pending piece type choice',
      };
    }

    // Set the focused piece type for next turn
    this.state = {
      ...this.state,
      whiteFocusedPieceType: player === 'white' ? pieceType : this.state.whiteFocusedPieceType,
      blackFocusedPieceType: player === 'black' ? pieceType : this.state.blackFocusedPieceType,
      pendingPieceTypeChoice: null,
    };

    return {
      success: true,
      message: `Next turn will draw ${pieceType} moves only`,
      newView: this.getPlayerView(player),
    };
  }

  /**
   * Check if player has pending piece type choice
   */
  public hasPendingPieceTypeChoice(player: Color): boolean {
    return this.state.pendingPieceTypeChoice != null && 
           this.state.pendingPieceTypeChoice.player === player;
  }

  /**
   * Get deck information for a player
   */
  public getDeckInfo(player: Color): {
    deck: readonly Card[];
    used: readonly Card[];
  } {
    const deck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    return {
      deck: deck.deck,
      used: deck.used,
    };
  }

  /**
   * Get opponent's deck information
   */
  public getOpponentDeckInfo(player: Color): {
    deck: readonly Card[];
    used: readonly Card[];
  } {
    const opponent: Color = player === 'white' ? 'black' : 'white';
    const deck = opponent === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    return {
      deck: deck.deck,
      used: deck.used,
    };
  }

  /**
   * Get card play history
   */
  public getPlayHistory(): readonly {
    player: Color;
    card: Card;
    turnNumber: number;
    isMoveCard: boolean;
  }[] {
    return this.state.playHistory;
  }

  /**
   * Get pending card selection for player
   */
  public getPendingCardSelection(player: Color): {
    action: 'recover' | 'activate';
    maxCount: number;
    triggeringCardId: string;
  } | undefined {
    if (this.state.pendingCardSelection && this.state.pendingCardSelection.player === player) {
      return {
        action: this.state.pendingCardSelection.action,
        maxCount: this.state.pendingCardSelection.maxCount,
        triggeringCardId: this.state.pendingCardSelection.triggeringCardId,
      };
    }
    return undefined;
  }

  /**
   * Cancel card selection from used pile
   */
  public cancelCardSelection(player: Color): ActionResult {
    if (!this.state.pendingCardSelection || this.state.pendingCardSelection.player !== player) {
      return {
        success: false,
        message: 'No pending card selection',
      };
    }

    // Clear pending selection
    this.state = {
      ...this.state,
      pendingCardSelection: null,
    };

    return {
      success: true,
      message: 'Card selection cancelled',
      newView: this.getPlayerView(player),
    };
  }

  /**
   * Select cards from used pile to recover (Salvage card)
   */
  public selectCardsFromUsed(player: Color, cardIds: string[]): ActionResult {
    if (!this.state.pendingCardSelection || 
        this.state.pendingCardSelection.player !== player ||
        this.state.pendingCardSelection.action !== 'recover') {
      return {
        success: false,
        message: 'No pending card recovery',
      };
    }

    const maxCount = this.state.pendingCardSelection.maxCount;
    if (cardIds.length > maxCount) {
      return {
        success: false,
        message: `Can only select up to ${maxCount} cards`,
      };
    }

    // Get player's used pile
    const deck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    
    // Find and remove selected cards from used pile
    const selectedCards: Card[] = [];
    const remainingUsed: Card[] = [];
    
    for (const card of deck.used) {
      if (cardIds.includes(card.id) && selectedCards.length < cardIds.length) {
        selectedCards.push(card);
      } else {
        remainingUsed.push(card);
      }
    }

    if (selectedCards.length !== cardIds.length) {
      return {
        success: false,
        message: 'Some selected cards not found in used pile',
      };
    }

    // Shuffle selected cards back into deck
    const newDeck = [...deck.deck, ...selectedCards].sort(() => Math.random() - 0.5);

    this.state = {
      ...this.state,
      whiteDeck: player === 'white' ? {
        deck: newDeck,
        used: remainingUsed,
      } : this.state.whiteDeck,
      blackDeck: player === 'black' ? {
        deck: newDeck,
        used: remainingUsed,
      } : this.state.blackDeck,
      pendingCardSelection: null,
    };

    return {
      success: true,
      message: `Recovered ${selectedCards.length} card${selectedCards.length > 1 ? 's' : ''} back to deck`,
      newView: this.getPlayerView(player),
    };
  }

  /**
   * Activate a card from used pile (Recall card)
   */
  public activateCardFromUsed(player: Color, cardId: string): ActionResult {
    if (!this.state.pendingCardSelection || 
        this.state.pendingCardSelection.player !== player ||
        this.state.pendingCardSelection.action !== 'activate') {
      return {
        success: false,
        message: 'No pending card activation',
      };
    }

    // Get player's used pile
    const deck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    
    // Find the card in used pile
    const card = deck.used.find(c => c.id === cardId);
    if (!card) {
      return {
        success: false,
        message: 'Card not found in used pile',
      };
    }

    // Clear pending selection
    this.state = {
      ...this.state,
      pendingCardSelection: null,
    };

    // Activate the card's effect
    const result = playCard(this.state.gameState, card, NO_PARAMS, player);
    
    if (result.success) {
      this.state = {
        ...this.state,
        gameState: result.newState,
      };
      
      // Handle any metadata from the effect
      if (result.metadata) {
        this.handleEffectMetadata(result.metadata, player);
      }
    }

    return {
      success: result.success,
      message: result.message || 'Card activated from used pile',
      newView: this.getPlayerView(player),
    };
  }

  /**
   * Get pending board action for player
   */
  public getPendingBoardAction(player: Color): {
    action: 'swapPieces' | 'placeTrap' | 'convertPawn';
    cardId: string;
  } | undefined {
    if (this.state.pendingBoardAction && this.state.pendingBoardAction.player === player) {
      return {
        action: this.state.pendingBoardAction.action,
        cardId: this.state.pendingBoardAction.cardId,
      };
    }
    return undefined;
  }

  /**
   * Complete swap pieces action (Tactical Reposition)
   */
  public completeSwapPieces(player: Color, position1: Position, position2: Position): ActionResult {
    if (!this.state.pendingBoardAction || 
        this.state.pendingBoardAction.player !== player ||
        this.state.pendingBoardAction.action !== 'swapPieces') {
      return {
        success: false,
        message: 'No pending swap pieces action',
      };
    }

    const cardId = this.state.pendingBoardAction.cardId;
    
    // Find the card in used pile
    const deck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    const card = deck.used.find(c => c.id === cardId);
    
    if (!card || !card.effect) {
      return {
        success: false,
        message: 'Card not found',
      };
    }

    // Execute the effect with positions
    const params = { position1, position2 } as any;
    const result = card.effect.execute({
      state: this.state.gameState,
      params,
      playerId: player,
      cardId,
    });
    
    // Clear pending action and update state
    this.state = {
      ...this.state,
      gameState: result.newState,
      pendingBoardAction: null,
    };

    return {
      success: result.success,
      message: result.message || 'Pieces swapped',
      newView: this.getPlayerView(player),
    };
  }

  /**
   * Complete place trap action (Trap Field)
   */
  public completePlaceTrap(player: Color, targetPosition: Position): ActionResult {
    if (!this.state.pendingBoardAction || 
        this.state.pendingBoardAction.player !== player ||
        this.state.pendingBoardAction.action !== 'placeTrap') {
      return {
        success: false,
        message: 'No pending place trap action',
      };
    }

    const cardId = this.state.pendingBoardAction.cardId;
    
    // Find the card in used pile
    const deck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    const card = deck.used.find(c => c.id === cardId);
    
    if (!card || !card.effect) {
      return {
        success: false,
        message: 'Card not found',
      };
    }

    // Execute the effect with target position
    const params = { type: 'spawn' as const, targetPosition };
    const result = card.effect.execute({
      state: this.state.gameState,
      params,
      playerId: player,
      cardId,
    });
    
    // Clear pending action and update state
    this.state = {
      ...this.state,
      gameState: result.newState,
      pendingBoardAction: null,
    };

    return {
      success: result.success,
      message: result.message || 'Trap placed',
      newView: this.getPlayerView(player),
    };
  }

  /**
   * Complete convert pawn action (Conversion)
   */
  public completeConvertPawn(player: Color, targetPosition: Position): ActionResult {
    if (!this.state.pendingBoardAction || 
        this.state.pendingBoardAction.player !== player ||
        this.state.pendingBoardAction.action !== 'convertPawn') {
      return {
        success: false,
        message: 'No pending convert pawn action',
      };
    }

    const cardId = this.state.pendingBoardAction.cardId;
    
    // Find the card in used pile
    const deck = player === 'white' ? this.state.whiteDeck : this.state.blackDeck;
    const card = deck.used.find(c => c.id === cardId);
    
    if (!card || !card.effect) {
      return {
        success: false,
        message: 'Card not found',
      };
    }

    // Execute the effect with target position
    const params = { type: 'spawn' as const, targetPosition };
    const result = card.effect.execute({
      state: this.state.gameState,
      params,
      playerId: player,
      cardId,
    });
    
    // Clear pending action and update state
    this.state = {
      ...this.state,
      gameState: result.newState,
      pendingBoardAction: null,
    };

    return {
      success: result.success,
      message: result.message || 'Pawn converted',
      newView: this.getPlayerView(player),
    };
  }

  /**
   * Cancel board action
   */
  public cancelBoardAction(player: Color): ActionResult {
    if (!this.state.pendingBoardAction || this.state.pendingBoardAction.player !== player) {
      return {
        success: false,
        message: 'No pending board action',
      };
    }

    // Clear pending action
    this.state = {
      ...this.state,
      pendingBoardAction: null,
    };

    return {
      success: true,
      message: 'Board action cancelled',
      newView: this.getPlayerView(player),
    };
  }

  /**
   * Get the complete internal state (for serialization/synchronization)
   */
  public getState(): EnhancedGameState {
    return this.state;
  }

  /**
   * Set the complete internal state (for deserialization/synchronization)
   * WARNING: This replaces the entire state. Use with caution.
   */
  public setState(newState: EnhancedGameState): void {
    this.state = newState;
  }
}
