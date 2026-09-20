/**
 * Effect metadata handling.
 *
 * Card effects do not mutate the match themselves. They return metadata with an
 * `action` field, and this module interprets it. That indirection is what keeps
 * effects ignorant of turn management (see CONTEXT.md, design decision 2).
 *
 * `applyEffectMetadata` is pure: it returns the next state and never mutates
 * the one it is given.
 */

import { Color } from '../../core/index.js';
import { HandManager } from '../moveCards/handManagerV2.js';
import { EnhancedGameState, drawFromDeck, opponentOf } from './state.js';

/**
 * Actions that let the player keep playing after the card resolves.
 *
 * Everything not listed here ends the turn. The split is a balance decision:
 * cards that only modify your own resources let you continue, cards that touch
 * the board or the opponent do not.
 */
const CONTINUE_TURN_ACTIONS: readonly string[] = [
  'drawCard',
  'rerollMoves',
  'drawExtraMoves',
  'freeMove',
  'focusStrategy',
  'opponentDrawLess',
  'skipTurn',
  'doubleTurn',
  'stealCard',
];

/**
 * Should playing this special card end the player's turn?
 *
 * A card with no metadata affects the board directly, so it ends the turn.
 */
export function shouldSpecialCardEndTurn(metadata?: Record<string, unknown>): boolean {
  if (!metadata || !metadata.action) {
    return true;
  }
  return !CONTINUE_TURN_ACTIONS.includes(metadata.action as string);
}

/**
 * Apply the state change an effect asked for via its metadata.
 *
 * Unknown actions are ignored, which is deliberate: an effect may return
 * metadata purely to inform the UI.
 */
export function applyEffectMetadata(
  state: EnhancedGameState,
  metadata: Record<string, unknown>,
  player: Color
): EnhancedGameState {
  const action = metadata.action as string;

  switch (action) {
    case 'drawCard': {
      // Draw special card from deck
      const count = (metadata.count as number) || 1;
      let currentDeck = player === 'white' ? state.whiteDeck : state.blackDeck;
      let currentHand = player === 'white' ? state.whiteHand : state.blackHand;

      for (let i = 0; i < count; i++) {
        const { newDeck, drawnCard } = drawFromDeck(currentDeck);
        if (drawnCard) {
          currentHand = HandManager.addSpecialCard(currentHand, drawnCard);
          currentDeck = newDeck;
        }
      }

      return {
        ...state,
        whiteHand: player === 'white' ? currentHand : state.whiteHand,
        blackHand: player === 'black' ? currentHand : state.blackHand,
        whiteDeck: player === 'white' ? currentDeck : state.whiteDeck,
        blackDeck: player === 'black' ? currentDeck : state.blackDeck,
      };
    }

    case 'rerollMoves': {
      // Clear current move cards and draw new ones
      const hand = player === 'white' ? state.whiteHand : state.blackHand;
      const clearedHand = HandManager.clearMoveCards(hand);
      const newHand = HandManager.drawMoveCards(state.gameState, player, clearedHand);

      return {
        ...state,
        whiteHand: player === 'white' ? newHand : state.whiteHand,
        blackHand: player === 'black' ? newHand : state.blackHand,
      };
    }

    case 'drawExtraMoves': {
      // Draw additional move cards (beyond normal max)
      const count = (metadata.count as number) || 3;
      const hand = player === 'white' ? state.whiteHand : state.blackHand;

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
        state.gameState,
        player,
        tempHand,
        true // Ignore max limit
      );

      // Restore original config
      const finalHand = {
        ...newHand,
        config: hand.config,
      };

      return {
        ...state,
        whiteHand: player === 'white' ? finalHand : state.whiteHand,
        blackHand: player === 'black' ? finalHand : state.blackHand,
      };
    }

    case 'opponentDrawLess': {
      // Opponent draws fewer cards next turn
      const reduction = (metadata.reduction as number) || 1;
      const opponent = opponentOf(player);

      return {
        ...state,
        whiteDrawModifier: opponent === 'white' ? -reduction : state.whiteDrawModifier,
        blackDrawModifier: opponent === 'black' ? -reduction : state.blackDrawModifier,
      };
    }

    case 'restrictMoves': {
      // Opponent gets fewer move cards next turn
      const reduction = (metadata.reduction as number) || 2;
      const opponent = opponentOf(player);

      return {
        ...state,
        whiteDrawModifier: opponent === 'white' ? -reduction : state.whiteDrawModifier,
        blackDrawModifier: opponent === 'black' ? -reduction : state.blackDrawModifier,
      };
    }

    case 'skipTurn': {
      // Opponent skips their next turn
      return {
        ...state,
        skipNextTurn: opponentOf(player),
      };
    }

    case 'doubleTurn': {
      // Player gets two turns after opponent takes one turn
      return {
        ...state,
        skipTurnAfterNext: opponentOf(player),
      };
    }

    case 'freeMove': {
      // Enable free move for current player this turn
      return {
        ...state,
        freeMoveEnabled: player,
      };
    }

    case 'focusStrategy': {
      // Requires player input; the UI prompts for the piece type.
      return state;
    }

    case 'recoverCards': {
      // Player needs to select cards from used pile to recover
      return {
        ...state,
        pendingCardSelection: {
          player,
          action: 'recover',
          maxCount: (metadata.count as number) || 2,
          triggeringCardId: (metadata.triggeringCardId as string) || '',
        },
      };
    }

    case 'activateUsedCard': {
      // Player needs to select a card from used pile to activate
      return {
        ...state,
        pendingCardSelection: {
          player,
          action: 'activate',
          maxCount: 1,
          triggeringCardId: (metadata.triggeringCardId as string) || '',
        },
      };
    }

    case 'stealCard': {
      // Draw a random card from opponent's deck
      const opponent = opponentOf(player);
      const opponentDeck = opponent === 'white' ? state.whiteDeck : state.blackDeck;
      const playerHand = player === 'white' ? state.whiteHand : state.blackHand;

      const { newDeck: updatedOpponentDeck, drawnCard } = drawFromDeck(opponentDeck);

      // If opponent's deck is empty, nothing happens
      if (!drawnCard) {
        return state;
      }

      const updatedPlayerHand = HandManager.addSpecialCard(playerHand, drawnCard);

      return {
        ...state,
        whiteHand: player === 'white' ? updatedPlayerHand : state.whiteHand,
        blackHand: player === 'black' ? updatedPlayerHand : state.blackHand,
        whiteDeck: opponent === 'white' ? updatedOpponentDeck : state.whiteDeck,
        blackDeck: opponent === 'black' ? updatedOpponentDeck : state.blackDeck,
      };
    }

    default:
      // Unknown action - ignore
      return state;
  }
}
