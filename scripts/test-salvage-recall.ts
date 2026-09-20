/**
 * Test for Salvage and Recall cards
 * 
 * Verifies that the card selection dialog appears and cards can be selected from used pile
 */

import { EnhancedGameController } from '../src/cards/enhancedGameController.js';
import { Card } from '../src/cards/types/card.js';
import { NO_PARAMS } from '../src/cards/types/effect.js';

// Import the Salvage and Recall cards
import { CARD_LIBRARY } from '../src/cards/cardLibrary.js';

console.log('Testing Salvage and Recall Cards');
console.log('='.repeat(50));

// Find Salvage and Recall cards
const salvageCard = CARD_LIBRARY.find(c => c.card.id === 'recover-cards-1')?.card;
const recallCard = CARD_LIBRARY.find(c => c.card.id === 'activate-used-1')?.card;

if (!salvageCard || !recallCard) {
  console.error('❌ Could not find Salvage or Recall cards in library');
  process.exit(1);
}

console.log('✅ Found Salvage card:', salvageCard.name);
console.log('✅ Found Recall card:', recallCard.name);
console.log();

// Create test decks with Salvage and Recall
const testDeck: Card[] = [
  salvageCard,
  recallCard,
];

// Create controller with test decks
const controller = new EnhancedGameController(undefined, undefined, testDeck, testDeck);

console.log('Test 1: Salvage Card (Recover from Used Pile)');
console.log('-'.repeat(50));

// First, we need to play a special card so it goes to the used pile
// Let's add a draw card to the deck and play it
const drawCard = CARD_LIBRARY.find(c => c.card.id === 'draw-card-1')?.card;
if (drawCard) {
  // Add it to hand manually for testing
  const whiteHand = controller['state'].whiteHand;
  controller['state'] = {
    ...controller['state'],
    whiteHand: {
      ...whiteHand,
      specialCards: [drawCard, salvageCard],
    },
  };

  // Play the draw card so it goes to used pile
  console.log('Playing Draw Card to populate used pile...');
  const drawResult = controller.playCardAction('white', drawCard.id, NO_PARAMS, false);
  console.log(drawResult.success ? '✅' : '❌', drawResult.message);
  
  // Check used pile
  const deckInfo = controller.getDeckInfo('white');
  console.log(`Used pile size: ${deckInfo.used.length}`);
  console.log('Cards in used pile:', deckInfo.used.map(c => c.name).join(', '));
  console.log();
  
  if (deckInfo.used.length > 0) {
    // Now play Salvage card
    console.log('Playing Salvage card...');
    const salvageResult = controller.playCardAction('white', salvageCard.id, NO_PARAMS, false);
    console.log(salvageResult.success ? '✅' : '❌', salvageResult.message);
    
    // Check if pending card selection is set
    const playerView = controller.getPlayerView('white');
    if (playerView.pendingCardSelection) {
      console.log('✅ Pending card selection detected!');
      console.log('   Action:', playerView.pendingCardSelection.action);
      console.log('   Max count:', playerView.pendingCardSelection.maxCount);
      
      // Select cards from used pile
      const cardToRecover = deckInfo.used[0];
      console.log(`Selecting card to recover: ${cardToRecover.name}`);
      const selectResult = controller.selectCardsFromUsed('white', [cardToRecover.id]);
      console.log(selectResult.success ? '✅' : '❌', selectResult.message);
      
      // Check if card was moved back to deck
      const updatedDeckInfo = controller.getDeckInfo('white');
      console.log(`Deck size after recovery: ${updatedDeckInfo.deck.length}`);
      console.log(`Used pile size after recovery: ${updatedDeckInfo.used.length}`);
      
      if (updatedDeckInfo.used.length < deckInfo.used.length) {
        console.log('✅ Card successfully recovered from used pile!');
      } else {
        console.log('❌ Card was not recovered');
      }
    } else {
      console.log('❌ No pending card selection found');
    }
  }
}

console.log();
console.log('Test 2: Recall Card (Activate from Used Pile)');
console.log('-'.repeat(50));

// Reset and test Recall
const controller2 = new EnhancedGameController(undefined, undefined, testDeck, testDeck);

// Add cards to hand and used pile
const timeFreeze = CARD_LIBRARY.find(c => c.card.id === 'skip-turn-1')?.card;
if (timeFreeze && recallCard) {
  const whiteHand = controller2['state'].whiteHand;
  controller2['state'] = {
    ...controller2['state'],
    whiteHand: {
      ...whiteHand,
      specialCards: [timeFreeze, recallCard],
    },
  };

  // Play Time Freeze so it goes to used pile
  console.log('Playing Time Freeze to populate used pile...');
  const playResult = controller2.playCardAction('white', timeFreeze.id, NO_PARAMS, false);
  console.log(playResult.success ? '✅' : '❌', playResult.message);
  
  // Check used pile
  const deckInfo2 = controller2.getDeckInfo('white');
  console.log(`Used pile size: ${deckInfo2.used.length}`);
  console.log('Cards in used pile:', deckInfo2.used.map(c => c.name).join(', '));
  console.log();
  
  if (deckInfo2.used.length > 0) {
    // Now play Recall card
    console.log('Playing Recall card...');
    const recallResult = controller2.playCardAction('white', recallCard.id, NO_PARAMS, false);
    console.log(recallResult.success ? '✅' : '❌', recallResult.message);
    
    // Check if pending card selection is set
    const playerView2 = controller2.getPlayerView('white');
    if (playerView2.pendingCardSelection) {
      console.log('✅ Pending card selection detected!');
      console.log('   Action:', playerView2.pendingCardSelection.action);
      console.log('   Max count:', playerView2.pendingCardSelection.maxCount);
      
      // Activate card from used pile
      const cardToActivate = deckInfo2.used[0];
      console.log(`Activating card from used pile: ${cardToActivate.name}`);
      const activateResult = controller2.activateCardFromUsed('white', cardToActivate.id);
      console.log(activateResult.success ? '✅' : '❌', activateResult.message);
      
      // Check if the card is still in used pile (it should be, since Recall doesn't remove it)
      const updatedDeckInfo2 = controller2.getDeckInfo('white');
      console.log(`Used pile size after activation: ${updatedDeckInfo2.used.length}`);
      
      if (updatedDeckInfo2.used.length === deckInfo2.used.length) {
        console.log('✅ Card activated without removing from used pile!');
      } else {
        console.log('❌ Card was removed from used pile (should stay)');
      }
    } else {
      console.log('❌ No pending card selection found');
    }
  }
}

console.log();
console.log('='.repeat(50));
console.log('All tests completed!');
