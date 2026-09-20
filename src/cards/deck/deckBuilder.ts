/**
 * Deck Builder
 * 
 * Erstellt vorkonfigurierte Decks und Templates.
 * Ermöglicht Custom Deck Building.
 */

import { Card } from '../types/card.js';
import { Color } from '../../core/index.js';
import {
  DeckState,
  DeckTemplate,
  DeckCardEntry,
  DeckConfig,
  DEFAULT_DECK_CONFIG,
} from './deckTypes.js';
import { createDeckFromCards } from './deckManager.js';
import {
  timeFreezeCard,
  summonKnightCard,
  summonPawnCard,
  doubleTimeCard,
  desperateSummonCard,
} from '../cards/basicCards.js';

/**
 * Erstellt ein Deck aus einem Template
 */
export function buildDeckFromTemplate(
  template: DeckTemplate,
  owner: Color,
  config: DeckConfig = DEFAULT_DECK_CONFIG
): DeckState {
  const cards: Card[] = [];
  
  // Template-Einträge expandieren
  for (const entry of template.cards) {
    for (let i = 0; i < entry.count; i++) {
      cards.push(entry.card);
    }
  }
  
  // Validierung
  if (cards.length < template.minSize || cards.length > template.maxSize) {
    throw new Error(
      `Deck size ${cards.length} outside allowed range [${template.minSize}, ${template.maxSize}]`
    );
  }
  
  return createDeckFromCards(owner, cards, config);
}

/**
 * Erstellt ein Custom Deck aus einer Kartenliste
 */
export function buildCustomDeck(
  owner: Color,
  cards: ReadonlyArray<Card>,
  config: DeckConfig = DEFAULT_DECK_CONFIG,
  minSize: number = 20,
  maxSize: number = 60
): DeckState {
  if (cards.length < minSize || cards.length > maxSize) {
    throw new Error(
      `Deck size ${cards.length} outside allowed range [${minSize}, ${maxSize}]`
    );
  }
  
  return createDeckFromCards(owner, cards, config);
}

/**
 * Validiert ein Deck (Regelkonformität)
 */
export function validateDeck(
  cards: ReadonlyArray<Card>,
  rules: {
    minSize: number;
    maxSize: number;
    maxCopiesPerCard?: number;
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Größe prüfen
  if (cards.length < rules.minSize) {
    errors.push(`Deck too small: ${cards.length} < ${rules.minSize}`);
  }
  if (cards.length > rules.maxSize) {
    errors.push(`Deck too large: ${cards.length} > ${rules.maxSize}`);
  }
  
  // Kopienlimit prüfen
  if (rules.maxCopiesPerCard) {
    const cardCounts = new Map<string, number>();
    for (const card of cards) {
      const count = cardCounts.get(card.id) || 0;
      cardCounts.set(card.id, count + 1);
    }
    
    for (const [cardId, count] of cardCounts) {
      if (count > rules.maxCopiesPerCard) {
        errors.push(
          `Too many copies of card "${cardId}": ${count} > ${rules.maxCopiesPerCard}`
        );
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Vorkonfigurierte Deck-Templates
// ============================================================================

/**
 * Starter Deck: Balanced
 * 
 * Ausgewogene Mischung aus Summon- und Control-Karten.
 */
export const STARTER_BALANCED: DeckTemplate = {
  name: 'Balanced Starter',
  description: 'A balanced mix of summons and control cards',
  cards: [
    { card: summonPawnCard, count: 8 },
    { card: summonKnightCard, count: 6 },
    { card: timeFreezeCard, count: 3 },
    { card: doubleTimeCard, count: 3 },
  ],
  minSize: 15,
  maxSize: 30,
};

/**
 * Starter Deck: Aggressive
 * 
 * Fokus auf schnelle Figurenbeschwörung.
 */
export const STARTER_AGGRESSIVE: DeckTemplate = {
  name: 'Aggressive Starter',
  description: 'Focus on rapid piece deployment',
  cards: [
    { card: summonPawnCard, count: 10 },
    { card: summonKnightCard, count: 8 },
    { card: doubleTimeCard, count: 4 },
    { card: desperateSummonCard, count: 2 },
  ],
  minSize: 20,
  maxSize: 30,
};

/**
 * Starter Deck: Control
 * 
 * Fokus auf Tempo-Kontrolle und Timing.
 */
export const STARTER_CONTROL: DeckTemplate = {
  name: 'Control Starter',
  description: 'Control tempo and timing',
  cards: [
    { card: summonPawnCard, count: 6 },
    { card: summonKnightCard, count: 4 },
    { card: timeFreezeCard, count: 6 },
    { card: doubleTimeCard, count: 6 },
    { card: desperateSummonCard, count: 2 },
  ],
  minSize: 20,
  maxSize: 30,
};

/**
 * Alle verfügbaren Templates
 */
export const ALL_TEMPLATES: ReadonlyArray<DeckTemplate> = [
  STARTER_BALANCED,
  STARTER_AGGRESSIVE,
  STARTER_CONTROL,
];

/**
 * Findet ein Template nach Name
 */
export function getTemplateByName(name: string): DeckTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.name === name);
}

/**
 * Listet alle verfügbaren Karten auf
 */
export function getAllAvailableCards(): ReadonlyArray<Card> {
  return [
    timeFreezeCard,
    summonKnightCard,
    summonPawnCard,
    doubleTimeCard,
    desperateSummonCard,
  ];
}

/**
 * Erstellt ein zufälliges Deck aus verfügbaren Karten
 */
export function buildRandomDeck(
  owner: Color,
  size: number = 20,
  config: DeckConfig = DEFAULT_DECK_CONFIG
): DeckState {
  const availableCards = getAllAvailableCards();
  const cards: Card[] = [];
  
  for (let i = 0; i < size; i++) {
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    cards.push(availableCards[randomIndex]);
  }
  
  return createDeckFromCards(owner, cards, config);
}

/**
 * Hilfsfunktion: Erstellt einen Deck-Entry
 */
export function createDeckEntry(card: Card, count: number): DeckCardEntry {
  return { card, count };
}

/**
 * Hilfsfunktion: Erstellt ein Template aus Entries
 */
export function createTemplate(
  name: string,
  description: string,
  entries: ReadonlyArray<DeckCardEntry>,
  minSize: number = 20,
  maxSize: number = 60
): DeckTemplate {
  return {
    name,
    description,
    cards: entries,
    minSize,
    maxSize,
  };
}
