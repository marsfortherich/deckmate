/**
 * Turn lifecycle: ending a turn and setting up the next one.
 *
 * `completeTurnChange` is the busiest path in the game. In order it:
 *   1. ends the game if the position is terminal,
 *   2. burns a skipped turn and recurses,
 *   3. stops to ask about an unused special card,
 *   4. arms a delayed skip (Time Warp),
 *   5. clears the previous player's move cards and deals the new ones,
 *      honouring a draw modifier and any focused piece type,
 *   6. tops up the special-card slot and resets the per-turn flags.
 *
 * Both functions are pure: they return the next state and never mutate their
 * argument.
 */

import { Color, GameState } from '../../core/index.js';
import { isCheckmate, isStalemate } from '../../core/moves/moveValidator.js';
import { HandManager, PlayerHand } from '../moveCards/handManagerV2.js';
import { generateMoveCards } from '../moveCards/moveCardGenerator.js';
import { EnhancedGameState, drawFromDeck, opponentOf } from './state.js';

/** Statuses after which no further play happens. */
const TERMINAL_STATUSES: readonly string[] = ['checkmate', 'stalemate', 'draw', 'resigned'];

export function isGameOver(state: EnhancedGameState): boolean {
  return TERMINAL_STATUSES.includes(state.gameState.status);
}

/**
 * Check for game over conditions and update game status.
 */
export function checkGameOver(state: EnhancedGameState): EnhancedGameState {
  const currentState = state.gameState;

  // Skip if game is already over
  if (isGameOver(state)) {
    return state;
  }

  const { currentPlayer } = currentState;

  const withStatus = (status: GameState['status']): EnhancedGameState => ({
    ...state,
    gameState: { ...currentState, status },
  });

  if (isCheckmate(currentState.boardState.board, currentPlayer)) {
    return withStatus('checkmate');
  }

  if (isStalemate(currentState.boardState.board, currentPlayer)) {
    return withStatus('stalemate');
  }

  // 50-move rule: 100 half-moves without a capture or pawn move
  if (currentState.halfMoveClock >= 100) {
    return withStatus('draw');
  }

  return state;
}

/**
 * Deal the current player their move cards for this turn.
 *
 * When a piece type is focused (Focus Strategy), matching moves are dealt
 * first and any shortfall is topped up with random legal moves, so the hand is
 * never left unplayable.
 */
function drawMoveCardsForTurn(
  state: EnhancedGameState,
  currentPlayer: Color,
  tempHand: PlayerHand,
  drawCount: number,
  focusedPieceType: string | null
): PlayerHand {
  if (!focusedPieceType) {
    return HandManager.drawMoveCards(state.gameState, currentPlayer, tempHand);
  }

  const allMoveCards = generateMoveCards(state.gameState.boardState, currentPlayer);

  // Card names start with the piece type, e.g. "Pawn a2 → a3"
  const pieceName = focusedPieceType.charAt(0).toUpperCase() + focusedPieceType.slice(1);
  const filteredCards = allMoveCards.filter((card) => card.name.startsWith(pieceName));

  const shuffledFiltered = [...filteredCards].sort(() => Math.random() - 0.5);
  const focusedDraw = shuffledFiltered.slice(0, drawCount);

  let finalDraw = focusedDraw;
  if (focusedDraw.length < drawCount) {
    const remaining = drawCount - focusedDraw.length;
    const otherCards = allMoveCards.filter((card) => !focusedDraw.some((fc) => fc.id === card.id));
    const shuffledOther = [...otherCards].sort(() => Math.random() - 0.5);
    finalDraw = [...focusedDraw, ...shuffledOther.slice(0, remaining)];
  }

  return {
    ...tempHand,
    moveCards: [...tempHand.moveCards, ...finalDraw],
  };
}

/**
 * Complete the turn change.
 *
 * @param skipDecisionCheck Skip the unused-special-card prompt, used when the
 *   player has just answered it.
 */
export function completeTurnChange(
  state: EnhancedGameState,
  skipDecisionCheck = false
): EnhancedGameState {
  const currentPlayer = state.gameState.currentPlayer;

  // Check for game over conditions before processing turn
  let next = checkGameOver(state);
  if (isGameOver(next)) {
    return next;
  }

  // FIRST: does the current player owe a skipped turn?
  if (next.skipNextTurn === currentPlayer) {
    const opponent = opponentOf(currentPlayer);

    const newGameState: GameState = {
      ...next.gameState,
      currentPlayer: opponent,
      turnNumber: next.gameState.turnNumber + 1,
    };

    next = {
      ...next,
      gameState: newGameState,
      skipNextTurn: null,
    };

    // Continue into the opponent's turn
    return completeTurnChange(next, false);
  }

  // SECOND: an unused special card from last turn needs a keep-or-discard answer
  const currentHand = currentPlayer === 'white' ? next.whiteHand : next.blackHand;
  if (!skipDecisionCheck && currentHand.specialCards.length > 0) {
    return {
      ...next,
      pendingSpecialCardDecision: {
        player: currentPlayer,
        card: currentHand.specialCards[0],
      },
      // Hold the card outside the hand until the player decides
      whiteHand:
        currentPlayer === 'white' ? HandManager.clearSpecialCards(next.whiteHand) : next.whiteHand,
      blackHand:
        currentPlayer === 'black' ? HandManager.clearSpecialCards(next.blackHand) : next.blackHand,
    };
  }

  // Time Warp: arm the skip for after this turn
  if (next.skipTurnAfterNext === currentPlayer) {
    next = {
      ...next,
      skipNextTurn: currentPlayer,
      skipTurnAfterNext: null,
    };
  }

  // Clear move cards from previous player
  const prevPlayer = opponentOf(currentPlayer);
  const prevHand = prevPlayer === 'white' ? next.whiteHand : next.blackHand;
  const clearedPrevHand = HandManager.clearMoveCards(prevHand);

  const drawModifier = currentPlayer === 'white' ? next.whiteDrawModifier : next.blackDrawModifier;
  const focusedPieceType =
    currentPlayer === 'white' ? next.whiteFocusedPieceType : next.blackFocusedPieceType;

  // Re-fetch hand after potential state changes
  const handForDrawing = currentPlayer === 'white' ? next.whiteHand : next.blackHand;

  // Apply the draw modifier by adjusting the config temporarily
  const modifiedConfig = {
    ...handForDrawing.config,
    drawMoveCardsPerTurn: Math.max(1, handForDrawing.config.drawMoveCardsPerTurn + drawModifier),
  };
  const tempHand = { ...handForDrawing, config: modifiedConfig };

  const handWithMoveCards = drawMoveCardsForTurn(
    next,
    currentPlayer,
    tempHand,
    modifiedConfig.drawMoveCardsPerTurn,
    focusedPieceType
  );

  // Restore original config
  const restoredHand = { ...handWithMoveCards, config: handForDrawing.config };

  // Top up the special card slot if it is empty
  let finalCurrentHand = restoredHand;
  let currentDeck = currentPlayer === 'white' ? next.whiteDeck : next.blackDeck;

  if (restoredHand.specialCards.length === 0) {
    const { newDeck, drawnCard } = drawFromDeck(currentDeck);
    if (drawnCard) {
      finalCurrentHand = HandManager.addSpecialCard(restoredHand, drawnCard);
      currentDeck = newDeck;
    }
  }

  return {
    ...next,
    whiteHand: currentPlayer === 'white' ? finalCurrentHand : clearedPrevHand,
    blackHand: currentPlayer === 'black' ? finalCurrentHand : clearedPrevHand,
    whiteDeck: currentPlayer === 'white' ? currentDeck : next.whiteDeck,
    blackDeck: currentPlayer === 'black' ? currentDeck : next.blackDeck,
    // Reset draw modifier after using it
    whiteDrawModifier: currentPlayer === 'white' ? 0 : next.whiteDrawModifier,
    blackDrawModifier: currentPlayer === 'black' ? 0 : next.blackDrawModifier,
    // Free move lasts one turn only
    freeMoveEnabled: null,
    // Clear focused piece type after using it
    whiteFocusedPieceType: currentPlayer === 'white' ? null : next.whiteFocusedPieceType,
    blackFocusedPieceType: currentPlayer === 'black' ? null : next.blackFocusedPieceType,
  };
}
