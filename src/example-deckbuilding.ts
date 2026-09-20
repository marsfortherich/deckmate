/**
 * Example: Deckbuilding System
 * 
 * Demonstriert das vollständige Deckbuilding-System:
 * - Deck-Erstellung mit Templates
 * - Karten ziehen, spielen, abwerfen
 * - Automatisches Mischen
 * - Multiplayer-ready Architektur
 */

import { DeckGameController } from './cards/deckGameController.js';
import { NO_PARAMS } from './cards/types/effect.js';
import {
  buildDeckFromTemplate,
  buildCustomDeck,
  STARTER_BALANCED,
  STARTER_AGGRESSIVE,
  STARTER_CONTROL,
  validateDeck,
} from './cards/deck/deckBuilder.js';
import {
  DEFAULT_DECK_CONFIG,
} from './cards/deck/deckTypes.js';
import {
  timeFreezeCard,
  summonKnightCard,
  summonPawnCard,
} from './cards/cards/basicCards.js';

console.log('╔════════════════════════════════════════════╗');
console.log('║   Deckbuilding System - Demo             ║');
console.log('╔════════════════════════════════════════════╗');
console.log('');

// ============================================================================
// Teil 1: Deck-Templates
// ============================================================================

console.log('═══ Teil 1: Deck-Templates ═══\n');

console.log('📦 Verfügbare Starter-Decks:');
console.log(`   1. ${STARTER_BALANCED.name}: ${STARTER_BALANCED.description}`);
console.log(`   2. ${STARTER_AGGRESSIVE.name}: ${STARTER_AGGRESSIVE.description}`);
console.log(`   3. ${STARTER_CONTROL.name}: ${STARTER_CONTROL.description}`);
console.log('');

// Validierung eines Templates
const balancedCards = STARTER_BALANCED.cards.flatMap(entry => 
  Array(entry.count).fill(entry.card)
);

const validation = validateDeck(balancedCards, {
  minSize: 15,
  maxSize: 30,
  maxCopiesPerCard: 10,
});

console.log('✓ Deck-Validierung:');
console.log(`   Balanced Deck: ${validation.valid ? '✓ Valid' : '✗ Invalid'}`);
if (!validation.valid) {
  validation.errors.forEach(err => console.log(`   - ${err}`));
}
console.log('');

// ============================================================================
// Teil 2: Custom Deck Building
// ============================================================================

console.log('═══ Teil 2: Custom Deck Building ═══\n');

const customCards = [
  ...Array(10).fill(summonPawnCard),
  ...Array(5).fill(summonKnightCard),
  ...Array(3).fill(timeFreezeCard),
];

console.log('🔨 Custom Deck erstellt:');
console.log(`   - ${10} x Summon Pawn`);
console.log(`   - ${5} x Summon Knight`);
console.log(`   - ${3} x Time Freeze`);
console.log(`   Total: ${customCards.length} Karten`);
console.log('');

const customWhiteDeck = buildCustomDeck('white', customCards, DEFAULT_DECK_CONFIG, 15, 25);
const customBlackDeck = buildDeckFromTemplate(STARTER_AGGRESSIVE, 'black');

console.log('✓ Decks erstellt:');
console.log(`   Weiß: Custom Deck (${customWhiteDeck.deck.length} Karten)`);
console.log(`   Schwarz: ${STARTER_AGGRESSIVE.name} (${customBlackDeck.deck.length} Karten)`);
console.log('');

// ============================================================================
// Teil 3: Game mit Deckbuilding
// ============================================================================

console.log('═══ Teil 3: Spiel mit Decks ═══\n');

const game = new DeckGameController(
  undefined, // Default game config
  {
    ...DEFAULT_DECK_CONFIG,
    initialDrawCount: 5,
    drawPerTurn: 1,
    maxHandSize: 7,
    autoShuffleOnEmpty: true,
  },
  customWhiteDeck,
  customBlackDeck
);

console.log('🎮 Spiel gestartet!\n');

// Initiale View
const whiteView = game.getPlayerView('white');
console.log('📋 Weiße Hand (Initial):');
console.log(`   Hand: ${whiteView.handSize} Karten`);
console.log(`   Deck: ${whiteView.deckSize} Karten`);
console.log(`   Discard: ${whiteView.discardSize} Karten`);
console.log('');

console.log('🃏 Karten auf der Hand:');
whiteView.myHand.forEach((card, idx) => {
  console.log(`   ${idx + 1}. ${card.name} - ${card.description}`);
});
console.log('');

// ============================================================================
// Teil 4: Karten spielen & ziehen
// ============================================================================

console.log('═══ Teil 4: Karten-Aktionen ═══\n');

// Weiß spielt erste Karte
console.log('▶ Weiß spielt Karte #1...');
const playResult = game.playCardAction('white', 0, NO_PARAMS);

if (playResult.success) {
  console.log(`   ✓ ${playResult.message}`);
  if (playResult.newView) {
    console.log(`   Hand jetzt: ${playResult.newView.handSize} Karten`);
  }
} else {
  console.log(`   ✗ ${playResult.message}`);
}
console.log('');

// Schwarz zieht Karten
console.log('▶ Schwarz zieht 2 Karten...');
const drawResult = game.drawCardsAction('black', 2);

if (drawResult.success) {
  console.log(`   ✓ ${drawResult.message}`);
  if (drawResult.drawnCards) {
    drawResult.drawnCards.forEach(card => {
      console.log(`      - ${card.name}`);
    });
  }
} else {
  console.log(`   ✗ ${drawResult.message}`);
}
console.log('');

// ============================================================================
// Teil 5: Mischen & Discard
// ============================================================================

console.log('═══ Teil 5: Mischen & Abwerfen ═══\n');

// Schwarz wirft Karten ab
console.log('▶ Schwarz wirft 2 Karten ab...');
const discardResult = game.discardCardsAction('black', [0, 1]);

if (discardResult.success) {
  console.log(`   ✓ ${discardResult.message}`);
  if (discardResult.newView) {
    console.log(`   Hand: ${discardResult.newView.handSize}`);
    console.log(`   Discard: ${discardResult.newView.discardSize}`);
  }
}
console.log('');

// Schwarz mischt Discard zurück ins Deck
console.log('▶ Schwarz mischt Discard ins Deck...');
const shuffleResult = game.shuffleDeckAction('black', 'discard');

if (shuffleResult.success) {
  console.log(`   ✓ ${shuffleResult.message}`);
  if (shuffleResult.newView) {
    console.log(`   Deck: ${shuffleResult.newView.deckSize}`);
    console.log(`   Discard: ${shuffleResult.newView.discardSize}`);
  }
}
console.log('');

// ============================================================================
// Teil 6: Statistiken
// ============================================================================

console.log('═══ Teil 6: Deck-Statistiken ═══\n');

const whiteStats = game.getDeckStatsAction('white');
const blackStats = game.getDeckStatsAction('black');

console.log('📊 Weiß:');
console.log(`   Deck: ${whiteStats.deckSize} Karten`);
console.log(`   Hand: ${whiteStats.handSize} Karten`);
console.log(`   Discard: ${whiteStats.discardSize} Karten`);
console.log(`   Total: ${whiteStats.totalCards} Karten`);
console.log(`   Gezogen: ${whiteStats.metadata.totalDraws} Karten`);
console.log(`   Gemischt: ${whiteStats.metadata.totalShuffles}x`);
console.log('');

console.log('📊 Schwarz:');
console.log(`   Deck: ${blackStats.deckSize} Karten`);
console.log(`   Hand: ${blackStats.handSize} Karten`);
console.log(`   Discard: ${blackStats.discardSize} Karten`);
console.log(`   Total: ${blackStats.totalCards} Karten`);
console.log(`   Gezogen: ${blackStats.metadata.totalDraws} Karten`);
console.log(`   Gemischt: ${blackStats.metadata.totalShuffles}x`);
console.log('');

// ============================================================================
// Finale Zusammenfassung
// ============================================================================

console.log('═══════════════════════════════════════════');
console.log('✅ System-Features demonstriert:');
console.log('═══════════════════════════════════════════');
console.log('  ✓ Deck-Templates (Balanced, Aggressive, Control)');
console.log('  ✓ Custom Deck Building');
console.log('  ✓ Deck-Validierung');
console.log('  ✓ Karten ziehen mit Auto-Shuffle');
console.log('  ✓ Karten spielen');
console.log('  ✓ Karten abwerfen');
console.log('  ✓ Manuelles Mischen');
console.log('  ✓ Deck-Statistiken');
console.log('  ✓ Multiplayer-ready (immutable State)');
console.log('');

console.log('═══════════════════════════════════════════');
console.log('🎯 Multiplayer-Tauglichkeit:');
console.log('═══════════════════════════════════════════');
console.log('  → Alle Funktionen sind pure (immutable)');
console.log('  → Deterministisches Shuffle mit Seed möglich');
console.log('  → State kann serialisiert werden');
console.log('  → Getrennte Decks pro Spieler');
console.log('  → PlayerView zeigt nur eigene Hand');
console.log('');

console.log('═══════════════════════════════════════════');
console.log('🔧 Nächste Schritte:');
console.log('═══════════════════════════════════════════');
console.log('  → Mehr Karten-Typen hinzufügen');
console.log('  → Deck-Editor UI implementieren');
console.log('  → Saved Decks (JSON persistence)');
console.log('  → Ranked Deck-Lists');
console.log('  → Meta-Game Balance');
console.log('  → Multiplayer Synchronisation');
console.log('');
