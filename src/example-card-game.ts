/**
 * Card-Based Chess Demo
 * 
 * Demonstriert das vollständige kartenbasierte Schach-System.
 * Spieler spielen Karten statt direkt Züge zu machen.
 */

import { GameController } from './cards/gameController.js';
import { summonKnightCard } from './cards/cards/basicCards.js';
import { NO_PARAMS } from './cards/types/effect.js';

console.log('╔════════════════════════════════════════════╗');
console.log('║   Kartenbasiertes Schach - Demo           ║');
console.log('╔════════════════════════════════════════════╗');
console.log();

// ===== Spiel initialisieren =====
const controller = new GameController();

console.log('🎮 Spiel gestartet!\n');

// ===== Runde 1: Weiß am Zug =====
console.log('═══ Runde 1: Weiß ═══\n');

let whiteView = controller.getPlayerView('white');
console.log(`Spieler am Zug: ${whiteView.currentPlayer}`);
console.log(`Zug-Nummer: ${whiteView.turnNumber}`);
console.log(`Kann Karte spielen: ${whiteView.canPlayCard ? '✓' : '✗'}`);
console.log();

console.log(`📋 Weiße Hand (${whiteView.myHand.stats.totalCards} Karten):`);
console.log(`   Zugkarten: ${whiteView.myHand.stats.moveCards}`);
console.log(`   Spezialkarten: ${whiteView.myHand.stats.specialCards}`);
console.log();

// Zeige erste 3 Zugkarten
console.log('🃏 Verfügbare Zugkarten:');
whiteView.myHand.moveCards.slice(0, 3).forEach((card, i) => {
  console.log(`   ${i + 1}. ${card.name}`);
});
if (whiteView.myHand.moveCards.length > 3) {
  console.log(`   ... +${whiteView.myHand.moveCards.length - 3} weitere`);
}
console.log();

// Weiß spielt erste Zugkarte
if (whiteView.myHand.moveCards.length > 0) {
  const firstCard = whiteView.myHand.moveCards[0];
  console.log(`▶ Weiß spielt: "${firstCard.name}"`);
  
  const result = controller.playCardAction('white', firstCard.id, NO_PARAMS, true);
  
  if (result.success) {
    console.log(`✓ ${result.message}`);
    console.log();
  } else {
    console.log(`✗ Fehler: ${result.message}`);
    console.log();
  }
}

// ===== Runde 2: Schwarz am Zug =====
console.log('═══ Runde 2: Schwarz ═══\n');

let blackView = controller.getPlayerView('black');
console.log(`Spieler am Zug: ${blackView.currentPlayer}`);
console.log(`Kann Karte spielen: ${blackView.canPlayCard ? '✓' : '✗'}`);
console.log();

console.log(`📋 Schwarze Hand (${blackView.myHand.stats.totalCards} Karten):`);
console.log(`   Zugkarten: ${blackView.myHand.stats.moveCards}`);
console.log();

console.log('🃏 Verfügbare Zugkarten:');
blackView.myHand.moveCards.slice(0, 3).forEach((card, i) => {
  console.log(`   ${i + 1}. ${card.name}`);
});
console.log();

// Schwarz spielt Zugkarte
if (blackView.myHand.moveCards.length > 0) {
  const firstCard = blackView.myHand.moveCards[0];
  console.log(`▶ Schwarz spielt: "${firstCard.name}"`);
  
  const result = controller.playCardAction('black', firstCard.id, NO_PARAMS, true);
  
  if (result.success) {
    console.log(`✓ ${result.message}`);
    console.log();
  }
}

// ===== Runde 3: Weiß spielt Spezialkarte =====
console.log('═══ Runde 3: Weiß + Spezialkarte ═══\n');

whiteView = controller.getPlayerView('white');

// Weiß zieht Spezialkarte
console.log(`🎴 Weiß zieht Spezialkarte: "${summonKnightCard.name}"`);
const drawResult = controller.drawSpecialCard('white', summonKnightCard);
console.log(`   ${drawResult.message}`);
console.log();

// Aktualisiere View
whiteView = controller.getPlayerView('white');
console.log(`📋 Weiße Hand jetzt:`);
console.log(`   Zugkarten: ${whiteView.myHand.stats.moveCards}`);
console.log(`   Spezialkarten: ${whiteView.myHand.stats.specialCards}`);
console.log();

// Erst normale Zugkarte spielen
if (whiteView.myHand.moveCards.length > 0) {
  const moveCard = whiteView.myHand.moveCards[0];
  console.log(`▶ Weiß spielt Zugkarte: "${moveCard.name}"`);
  
  const result = controller.playCardAction('white', moveCard.id, NO_PARAMS, true);
  console.log(`   ${result.success ? '✓' : '✗'} ${result.message}`);
  console.log();
}

// ===== Runde 4: Schwarz + Spezialkarte statt Zug =====
console.log('═══ Runde 4: Schwarz nutzt Spezialkarte ═══\n');

blackView = controller.getPlayerView('black');

// Schwarz zieht auch Spezialkarte
controller.drawSpecialCard('black', summonKnightCard);
blackView = controller.getPlayerView('black');

console.log(`▶ Schwarz spielt Spezialkarte: "${summonKnightCard.name}"`);
console.log(`   Ziel: Feld c6 (row: 5, col: 2)`);

const specialResult = controller.playCardAction(
  'black',
  summonKnightCard.id,
  {
    type: 'spawn',
    targetPosition: { row: 5, col: 2 },
    pieceType: 'knight',
  },
  false  // Spezialkarte!
);

if (specialResult.success) {
  console.log(`✓ ${specialResult.message}`);
  console.log(`   Springer wurde auf c6 gespawnt!`);
  console.log();
}

// WICHTIG: Schwarz ist IMMER NOCH am Zug!
blackView = controller.getPlayerView('black');
console.log(`⚠️  Wichtig: Spieler am Zug ist noch: ${blackView.currentPlayer}`);
console.log(`   (Spezialkarten wechseln nicht den Zug!)`);
console.log();

// Schwarz spielt jetzt reguläre Zugkarte
if (blackView.myHand.moveCards.length > 0) {
  const moveCard = blackView.myHand.moveCards[0];
  console.log(`▶ Schwarz spielt jetzt Zugkarte: "${moveCard.name}"`);
  
  const result = controller.playCardAction('black', moveCard.id, NO_PARAMS, true);
  console.log(`   ${result.success ? '✓' : '✗'} ${result.message}`);
  console.log();
}

// ===== Finale Statistiken =====
console.log('═══════════════════════════════════════════');
console.log('📊 Finale Statistiken');
console.log('═══════════════════════════════════════════');
console.log();

const state = controller._debugGetState();

console.log(`Aktueller Spieler: ${state.gameState.currentPlayer}`);
console.log(`Zug-Nummer: ${state.gameState.turnNumber}`);
console.log(`Gespielte Züge: ${state.gameState.moveHistory.length}`);
console.log(`Status: ${state.gameState.status}`);
console.log();

console.log('Weiße Hand:');
console.log(`  Zugkarten: ${state.whiteHand.moveCards.length}`);
console.log(`  Spezialkarten: ${state.whiteHand.specialCards.length}`);

console.log('Schwarze Hand:');
console.log(`  Zugkarten: ${state.blackHand.moveCards.length}`);
console.log(`  Spezialkarten: ${state.blackHand.specialCards.length}`);
console.log();

console.log('═══════════════════════════════════════════');
console.log('✅ System-Features demonstriert:');
console.log('═══════════════════════════════════════════');
console.log('  ✓ Zugkarten aus legalen Zügen generiert');
console.log('  ✓ Hand-Management (Ziehen & Ausspielen)');
console.log('  ✓ Spezialkarten zusätzlich zu Zügen');
console.log('  ✓ Spezialkarten wechseln NICHT den Zug');
console.log('  ✓ UI sieht nur PlayerView (nicht GameState)');
console.log('  ✓ Controller als Gateway zwischen UI & Logik');
console.log('  ✓ Nach Zugkarte: Alte Karten weg, neue ziehen');
console.log();

console.log('═══════════════════════════════════════════');
console.log('🎯 Nächste Schritte:');
console.log('═══════════════════════════════════════════');
console.log('  → UI-Layer implementieren (React/Vue)');
console.log('  → Visuelle Darstellung der Karten');
console.log('  → Deck-Building System');
console.log('  → Weitere Spezialkarten');
console.log('  → Multiplayer-Synchronisation');
console.log();
