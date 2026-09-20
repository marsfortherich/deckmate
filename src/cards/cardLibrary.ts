/**
 * Card Library
 * 
 * All available special cards with their limits for deck building
 */

import { Card } from './types/card.js';
import {
  drawCardEffect,
  rerollMovesEffect,
  freeMoveEffect,
  movePawnBackwardEffect,
  restrictMovesEffect,
  opponentDrawLessEffect,
  skipTurnEffect,
  doubleTurnEffect,
  recoverCardsEffect,
  stealCardEffect,
  drawExtraMovesEffect,
  swapPiecesEffect,
  placeTrapEffect,
  convertPawnEffect,
  activateUsedCardEffect,
  spawnPieceEffect,
} from './effects/index.js';

/**
 * Card definition with deck building limits
 */
export interface CardDefinition {
  readonly card: Card;
  readonly maxCopies: number;  // Max copies allowed in deck
  readonly category: string;    // For UI organization
}

/**
 * All available cards for deck building
 */
export const CARD_LIBRARY: ReadonlyArray<CardDefinition> = [
  // Draw Cards (2 max)
  {
    card: {
      id: 'draw-card-1',
      name: 'Card Draw',
      description: 'Draw one special card from your deck',
      rarity: 'common',
      cost: { mana: 0 },
      effect: drawCardEffect,
    },
    maxCopies: 2,
    category: 'Draw',
  },
  
  // Reroll Moves (4 max)
  {
    card: {
      id: 'reroll-moves-1',
      name: 'Tactical Reroll',
      description: 'Discard all move cards and draw new ones (avoiding duplicates when possible)',
      rarity: 'uncommon',
      cost: { mana: 0 },
      effect: rerollMovesEffect,
    },
    maxCopies: 4,
    category: 'Moves',
  },
  
  // Free Move (4 max)
  {
    card: {
      id: 'free-move-1',
      name: 'Wild Card',
      description: 'Make any legal move this turn, not limited to your move cards',
      rarity: 'rare',
      cost: { mana: 0 },
      effect: freeMoveEffect,
    },
    maxCopies: 4,
    category: 'Moves',
  },
  
  // Spawn Pawn (2 max)
  {
    card: {
      id: 'spawn-pawn-1',
      name: 'Reinforcements',
      description: 'Spawn a pawn next to one of your other pawns instead of making a move',
      rarity: 'uncommon',
      cost: { mana: 0 },
      effect: spawnPieceEffect,
    },
    maxCopies: 2,
    category: 'Summon',
  },
  
  // Move Pawn Backward (2 max)
  {
    card: {
      id: 'move-backward-1',
      name: 'Tactical Retreat',
      description: 'Move one of your pawns backwards one square (if empty)',
      rarity: 'common',
      cost: { mana: 0 },
      effect: movePawnBackwardEffect,
    },
    maxCopies: 2,
    category: 'Movement',
  },
  
  // Restrict Moves (2 max)
  {
    card: {
      id: 'restrict-moves-1',
      name: 'Focus Strategy',
      description: 'Choose a piece type. Next turn, prioritize drawing moves from that piece, filling remaining slots with random moves',
      rarity: 'uncommon',
      cost: { mana: 0 },
      effect: restrictMovesEffect,
    },
    maxCopies: 2,
    category: 'Strategy',
  },
  
  // Opponent Draw Less (2 max)
  {
    card: {
      id: 'opponent-draw-less-1',
      name: 'Tactical Pressure',
      description: 'Opponent draws one less move card next turn',
      rarity: 'uncommon',
      cost: { mana: 0 },
      effect: opponentDrawLessEffect,
    },
    maxCopies: 2,
    category: 'Disruption',
  },
  
  // Skip Turn (1 max)
  {
    card: {
      id: 'skip-turn-1',
      name: 'Time Freeze',
      description: 'Skip your opponent\'s next turn',
      rarity: 'legendary',
      cost: { mana: 0 },
      effect: skipTurnEffect,
    },
    maxCopies: 1,
    category: 'Control',
  },
  
  // Double Turn (1 max)
  {
    card: {
      id: 'double-turn-1',
      name: 'Time Warp',
      description: 'After opponent\'s next turn, they skip a turn (you get 2 turns in a row)',
      rarity: 'legendary',
      cost: { mana: 0 },
      effect: doubleTurnEffect,
    },
    maxCopies: 1,
    category: 'Control',
  },
  
  // Recover Cards (1 max)
  {
    card: {
      id: 'recover-cards-1',
      name: 'Salvage',
      description: 'Recover 2 cards from your used pile and shuffle them back into your deck',
      rarity: 'rare',
      cost: { mana: 0 },
      effect: recoverCardsEffect,
    },
    maxCopies: 1,
    category: 'Recovery',
  },
  
  // Steal Card (1 max)
  {
    card: {
      id: 'steal-card-1',
      name: 'Espionage',
      description: 'Draw a random card from your opponent\'s deck',
      rarity: 'legendary',
      cost: { mana: 0 },
      effect: stealCardEffect,
    },
    maxCopies: 1,
    category: 'Disruption',
  },
  
  // Draw Extra Moves (2 max)
  {
    card: {
      id: 'draw-extra-moves-1',
      name: 'Tactical Options',
      description: 'Draw three additional move cards',
      rarity: 'rare',
      cost: { mana: 0 },
      effect: drawExtraMovesEffect,
    },
    maxCopies: 2,
    category: 'Draw',
  },
  
  // Swap Pieces (2 max)
  {
    card: {
      id: 'swap-pieces-1',
      name: 'Tactical Reposition',
      description: 'Swap the positions of two of your own pieces',
      rarity: 'rare',
      cost: { mana: 0 },
      effect: swapPiecesEffect,
    },
    maxCopies: 2,
    category: 'Movement',
  },
  
  // Place Trap (2 max)
  {
    card: {
      id: 'place-trap-1',
      name: 'Trap Field',
      description: 'Place a trap on an empty square - first piece to enter it gets destroyed',
      rarity: 'rare',
      cost: { mana: 0 },
      effect: placeTrapEffect,
    },
    maxCopies: 2,
    category: 'Control',
  },
  
  // Convert Pawn (1 max)
  {
    card: {
      id: 'convert-pawn-1',
      name: 'Conversion',
      description: 'Convert one of your opponent\'s pawns to your side',
      rarity: 'legendary',
      cost: { mana: 0 },
      effect: convertPawnEffect,
    },
    maxCopies: 1,
    category: 'Control',
  },
  
  // Activate Used Card (1 max)
  {
    card: {
      id: 'activate-used-1',
      name: 'Recall',
      description: 'Activate the effect of one card from your used pile (without removing it)',
      rarity: 'legendary',
      cost: { mana: 0 },
      effect: activateUsedCardEffect,
    },
    maxCopies: 1,
    category: 'Recovery',
  },
];

/**
 * Get rarity color for UI
 */
export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common': return '#9ca3af';
    case 'uncommon': return '#3b82f6';
    case 'rare': return '#8b5cf6';
    case 'legendary': return '#f59e0b';
    default: return '#6b7280';
  }
}

/**
 * Validate deck composition
 */
export function validateDeck(selectedCards: Map<string, number>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  let totalCards = 0;
  
  selectedCards.forEach((count, cardId) => {
    const cardDef = CARD_LIBRARY.find(def => def.card.id === cardId);
    if (!cardDef) {
      errors.push(`Unknown card: ${cardId}`);
      return;
    }
    
    if (count > cardDef.maxCopies) {
      errors.push(`${cardDef.card.name}: Max ${cardDef.maxCopies} copies allowed`);
    }
    
    totalCards += count;
  });
  
  // Allow any deck size for testing
  // Minimum 1 card, no maximum
  if (totalCards < 1) {
    errors.push(`Deck must have at least 1 card (currently ${totalCards})`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
