/**
 * Characterisation tests for EnhancedGameController.
 *
 * These lock in the controller's observable behaviour so the class can be
 * refactored without silently changing the game. They describe what the
 * controller *does* today, which is not always what it ideally should do -
 * where the two differ, the test says so.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EnhancedGameController } from '../enhancedGameController';
import { CARD_LIBRARY } from '../cardLibrary';
import { Card } from '../types/card';
import { NO_PARAMS } from '../types/effect';

/** Build a deck of `count` copies of the named card, with unique instance ids. */
function deckOf(cardName: string, count: number): Card[] {
  const def = CARD_LIBRARY.find((d) => d.card.name === cardName);
  if (!def) {
    throw new Error(`No card named "${cardName}" in CARD_LIBRARY`);
  }
  return Array.from({ length: count }, (_, i) => ({
    ...def.card,
    id: `${def.card.id}-copy-${i}`,
  }));
}

describe('EnhancedGameController', () => {
  describe('initial state', () => {
    let controller: EnhancedGameController;

    beforeEach(() => {
      controller = new EnhancedGameController(undefined, undefined, deckOf('Card Draw', 20), deckOf('Card Draw', 20));
    });

    it('starts with white to move on turn 1', () => {
      const view = controller.getPlayerView('white');
      expect(view.currentPlayer).toBe('white');
      expect(view.turnNumber).toBe(1);
      expect(view.status).toBe('active');
    });

    it('sets up a standard 8x8 board', () => {
      const { board } = controller.getPlayerView('white');
      expect(board).toHaveLength(8);
      board.forEach((row) => expect(row).toHaveLength(8));
    });

    it('deals move cards and one special card to white only', () => {
      const white = controller.getPlayerView('white');
      const black = controller.getPlayerView('black');

      expect(white.myHand.moveCards.length).toBeGreaterThan(0);
      expect(white.myHand.specialCards).toHaveLength(1);

      // Black is dealt in when their turn begins, not at construction.
      expect(black.myHand.moveCards).toHaveLength(0);
      expect(black.myHand.specialCards).toHaveLength(0);
    });

    it('draws the special card out of the deck', () => {
      const { deck, used } = controller.getDeckInfo('white');
      expect(deck).toHaveLength(19);
      expect(used).toHaveLength(0);
    });

    it('only lets the player to move play a card', () => {
      expect(controller.getPlayerView('white').canPlayCard).toBe(true);
      expect(controller.getPlayerView('black').canPlayCard).toBe(false);
    });
  });

  describe('hidden information', () => {
    it('shows a player their own hand and only the opponent hand size', () => {
      const controller = new EnhancedGameController(
        undefined,
        undefined,
        deckOf('Card Draw', 20),
        deckOf('Card Draw', 20)
      );
      const white = controller.getPlayerView('white');

      expect(white.myHand.moveCards.length).toBeGreaterThan(0);
      expect(white.opponentHandSize).toBe(0);
      // PlayerView exposes no opponent card identities.
      expect(white).not.toHaveProperty('opponentHand');
    });
  });

  describe('playing a move card', () => {
    let controller: EnhancedGameController;

    beforeEach(() => {
      controller = new EnhancedGameController(undefined, undefined, deckOf('Card Draw', 20), deckOf('Card Draw', 20));
    });

    it('applies the move and passes the turn to black', () => {
      const view = controller.getPlayerView('white');
      const moveCard = view.myHand.moveCards[0];

      const result = controller.playCardAction('white', moveCard.id, NO_PARAMS, true);

      expect(result.success).toBe(true);
      expect(controller.getPlayerView('white').currentPlayer).toBe('black');
    });

    it('deals black a hand once the turn passes to them', () => {
      const moveCard = controller.getPlayerView('white').myHand.moveCards[0];
      controller.playCardAction('white', moveCard.id, NO_PARAMS, true);

      const black = controller.getPlayerView('black');
      expect(black.myHand.moveCards.length).toBeGreaterThan(0);
      expect(black.canPlayCard).toBe(true);
    });

    it('rejects a move card played by the player not to move', () => {
      const blackTurn = controller.getPlayerView('black');
      const result = controller.playCardAction('black', blackTurn.myHand.moveCards[0]?.id ?? 'nonexistent');

      expect(result.success).toBe(false);
    });

    it('rejects an unknown card id', () => {
      const result = controller.playCardAction('white', 'no-such-card', NO_PARAMS, true);
      expect(result.success).toBe(false);
    });

    it('records the play in history', () => {
      const moveCard = controller.getPlayerView('white').myHand.moveCards[0];
      controller.playCardAction('white', moveCard.id, NO_PARAMS, true);

      const history = controller.getPlayHistory();
      expect(history).toHaveLength(1);
      expect(history[0].player).toBe('white');
      expect(history[0].isMoveCard).toBe(true);
    });
  });

  describe('playing a special card that continues the turn', () => {
    it('keeps the turn with the player and moves the card to the used pile', () => {
      const controller = new EnhancedGameController(
        undefined,
        undefined,
        deckOf('Card Draw', 20),
        deckOf('Card Draw', 20)
      );

      const special = controller.getPlayerView('white').myHand.specialCards[0];
      const result = controller.playCardAction('white', special.id, NO_PARAMS, false);

      expect(result.success).toBe(true);
      // Card Draw is a "continue turn" card.
      expect(controller.getPlayerView('white').currentPlayer).toBe('white');
      expect(controller.getDeckInfo('white').used).toHaveLength(1);
    });
  });

  describe('state round-trip', () => {
    it('getState and setState preserve the player view', () => {
      const controller = new EnhancedGameController(
        undefined,
        undefined,
        deckOf('Card Draw', 20),
        deckOf('Card Draw', 20)
      );
      const before = controller.getPlayerView('white');

      const snapshot = controller.getState();
      const restored = new EnhancedGameController(
        undefined,
        undefined,
        deckOf('Card Draw', 20),
        deckOf('Card Draw', 20)
      );
      restored.setState(snapshot);

      const after = restored.getPlayerView('white');
      expect(after.currentPlayer).toBe(before.currentPlayer);
      expect(after.turnNumber).toBe(before.turnNumber);
      expect(after.myHand.moveCards).toHaveLength(before.myHand.moveCards.length);
      expect(after.board).toEqual(before.board);
    });
  });

  describe('deck views', () => {
    it('reports the opponent deck separately from your own', () => {
      const controller = new EnhancedGameController(
        undefined,
        undefined,
        deckOf('Card Draw', 20),
        deckOf('Tactical Reroll', 20)
      );

      // White drew one special card at construction; black has not drawn yet.
      expect(controller.getDeckInfo('white').deck).toHaveLength(19);
      expect(controller.getOpponentDeckInfo('white').deck).toHaveLength(20);
    });
  });
});
