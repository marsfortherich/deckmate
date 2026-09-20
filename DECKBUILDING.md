# Deckbuilding System

Das Deckbuilding-System ermöglicht es Spielern, eigene Kartendecks zu erstellen, zu verwalten und im Spiel zu nutzen.

## Architektur-Übersicht

```
DeckGameController
    ↓
├── Deck Management (deckManager.ts)
│   ├── drawCards()
│   ├── playCardFromDeck()
│   ├── discardCards()
│   ├── shuffleDeck()
│   └── mulligan()
│
├── Deck Building (deckBuilder.ts)
│   ├── Templates (Balanced, Aggressive, Control)
│   ├── buildDeckFromTemplate()
│   ├── buildCustomDeck()
│   └── validateDeck()
│
└── Deck Types (deckTypes.ts)
    ├── DeckState (deck, hand, discard)
    ├── DeckConfig
    └── DeckTemplate
```

## Core Konzepte

### DeckState

Jeder Spieler hat einen `DeckState` mit drei Kartenstapeln:

```typescript
interface DeckState {
  deck: Card[];      // Noch zu ziehende Karten
  hand: Card[];      // Karten auf der Hand
  discard: Card[];   // Abgeworfene Karten
  owner: Color;      // Spielerfarbe
  metadata: {...};   // Statistiken
}
```

### Deck-Konfiguration

```typescript
const config: DeckConfig = {
  maxHandSize: 7,              // Max. Handgröße
  autoShuffleOnEmpty: true,    // Auto-mischen wenn Deck leer
  initialDrawCount: 5,         // Karten beim Start
  drawPerTurn: 1,              // Karten pro Runde
  allowMulligan: false,        // Mulligan erlaubt?
};
```

### Deck-Templates

Vorkonfigurierte Decks für schnellen Start:

- **Balanced Starter**: Ausgewogene Mischung (20 Karten)
- **Aggressive Starter**: Fokus auf Summons (24 Karten)
- **Control Starter**: Fokus auf Tempo-Kontrolle (24 Karten)

## Verwendung

### 1. Deck erstellen

```typescript
import { buildDeckFromTemplate, STARTER_BALANCED } from './cards/deck/deckBuilder.js';

// Aus Template
const deck = buildDeckFromTemplate(STARTER_BALANCED, 'white');

// Custom Deck
const customCards = [
  ...Array(10).fill(summonPawnCard),
  ...Array(5).fill(summonKnightCard),
];
const customDeck = buildCustomDeck('white', customCards);
```

### 2. Game starten

```typescript
import { DeckGameController } from './cards/deckGameController.js';

const game = new DeckGameController(
  undefined,  // Game Config
  {           // Deck Config
    maxHandSize: 7,
    initialDrawCount: 5,
    drawPerTurn: 1,
    autoShuffleOnEmpty: true,
  },
  whiteDeck,  // Vorkonfiguriertes Deck für Weiß
  blackDeck   // Vorkonfiguriertes Deck für Schwarz
);
```

### 3. Karten-Aktionen

```typescript
// Karten ziehen
const drawResult = game.drawCardsAction('white', 2);

// Karte spielen
const playResult = game.playCardAction('white', 0, {
  targetPosition: { row: 4, col: 4 }
});

// Karten abwerfen
const discardResult = game.discardCardsAction('white', [0, 1]);

// Deck mischen
const shuffleResult = game.shuffleDeckAction('white', 'discard');
```

### 4. Player View

```typescript
const view = game.getPlayerView('white');

console.log(`Hand: ${view.handSize} Karten`);
console.log(`Deck: ${view.deckSize} Karten`);
console.log(`Discard: ${view.discardSize} Karten`);
console.log(`Opponent Hand: ${view.opponentHandSize} Karten`);
```

## Multiplayer-Tauglichkeit

Das System ist **multiplayer-ready**:

### ✅ Immutability

Alle Funktionen sind **pure** und geben neue States zurück:

```typescript
// Alte State bleibt unverändert
const newDeckState = drawCards(oldDeckState, 3, config);
```

### ✅ Deterministisches Shuffle

Für Multiplayer-Synchronisation mit Seed:

```typescript
import { shuffleArrayWithSeed } from './cards/deck/deckManager.js';

// Beide Clients nutzen gleichen Seed
const seed = gameState.turnNumber * 1000 + Date.now();
const shuffled = shuffleArrayWithSeed(cards, seed);
```

### ✅ Serialisierbar

State kann als JSON übertragen werden:

```typescript
const stateJson = JSON.stringify(game._debugGetState());
// → An Server senden
// → An anderen Client senden
```

### ✅ Information Hiding

Spieler sieht nur eigene Hand:

```typescript
const view = game.getPlayerView('white');
// ✓ view.myHand - Eigene Karten
// ✓ view.opponentHandSize - Nur Anzahl, keine Karten
```

## Feature-Erweiterungen

### Custom Templates erstellen

```typescript
import { createTemplate, createDeckEntry } from './cards/deck/deckBuilder.js';

const myTemplate: DeckTemplate = createTemplate(
  'My Custom Deck',
  'Focus on knight summons',
  [
    createDeckEntry(summonKnightCard, 10),
    createDeckEntry(timeFreezeCard, 5),
    createDeckEntry(doubleTimeCard, 5),
  ],
  15,  // Min size
  25   // Max size
);

const deck = buildDeckFromTemplate(myTemplate, 'white');
```

### Deck-Validierung

```typescript
import { validateDeck } from './cards/deck/deckBuilder.js';

const validation = validateDeck(cards, {
  minSize: 20,
  maxSize: 60,
  maxCopiesPerCard: 3,  // Max. 3 Kopien pro Karte
});

if (!validation.valid) {
  validation.errors.forEach(err => console.error(err));
}
```

### Mulligan (Hand neu ziehen)

```typescript
// Config muss allowMulligan: true haben
const result = game.mulliganAction('white');

if (result.success) {
  console.log('Hand neu gezogen!');
}
```

## API-Referenz

### DeckGameController Methods

| Method | Beschreibung |
|--------|-------------|
| `getPlayerView(player)` | Gibt View für einen Spieler zurück |
| `drawCardsAction(player, count)` | Zieht Karten vom Deck |
| `playCardAction(player, cardIndex, params)` | Spielt Karte aus Hand |
| `discardCardsAction(player, indices)` | Wirft Karten ab |
| `shuffleDeckAction(player, source)` | Mischt Deck/Discard |
| `mulliganAction(player)` | Hand neu ziehen (wenn erlaubt) |
| `getDeckStatsAction(player)` | Gibt Statistiken zurück |

### Deck Manager Functions

| Function | Beschreibung |
|----------|-------------|
| `createEmptyDeck(owner)` | Leeres Deck erstellen |
| `createDeckFromCards(owner, cards)` | Deck aus Karten erstellen |
| `drawCards(state, count, config)` | Karten ziehen |
| `playCardFromDeck(state, cardIndex)` | Karte von Hand entfernen |
| `discardCards(state, indices)` | Karten abwerfen |
| `shuffleDeck(state, source)` | Deck mischen |
| `mulligan(state, config)` | Hand neu ziehen |
| `getDeckStats(state)` | Statistiken abrufen |

### Deck Builder Functions

| Function | Beschreibung |
|----------|-------------|
| `buildDeckFromTemplate(template, owner, config)` | Deck aus Template |
| `buildCustomDeck(owner, cards, config)` | Custom Deck |
| `buildRandomDeck(owner, size, config)` | Zufälliges Deck |
| `validateDeck(cards, rules)` | Deck validieren |
| `getAllAvailableCards()` | Alle verfügbaren Karten |
| `getTemplateByName(name)` | Template finden |

## Beispiele

Siehe:
- `example-deckbuilding.ts` - Vollständige Demo
- `DeckGameController` - Controller-Implementierung
- `deckManager.ts` - Core-Logik

## Nächste Schritte

Mögliche Erweiterungen:

1. **Deck Persistence**
   - Decks als JSON speichern/laden
   - Deck-Collection verwalten

2. **Deck Editor UI**
   - Visuelles Deck-Building
   - Drag & Drop Interface
   - Kartengalerie

3. **Meta-Game**
   - Deck-Rankings
   - Win-Rates pro Deck
   - Meta-Analysen

4. **Advanced Features**
   - Sideboard (Reserve-Karten)
   - Banned Cards
   - Format-Restrictions (Standard, Modern, etc.)

5. **Multiplayer**
   - Deck-Sharing
   - Tournament Formats
   - Draft Modes
