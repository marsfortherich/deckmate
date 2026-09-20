# Kartensystem - Entwickler-Guide

## Übersicht

Das Kartensystem ist vollständig modular und unabhängig von der Schach-Engine.

### Architektur

```
Effect-Definition → Card-Definition → Effect-Resolver → GameState
     ↓                    ↓                   ↓              ↓
  Pure Function      Datenobjekt       Orchestrierung   Immutable
```

## Neue Karte hinzufügen

### Schritt 1: Effekt erstellen

Erstelle eine neue Datei in `src/cards/effects/`:

```typescript
// src/cards/effects/teleport.ts

import {
  EffectDefinition,
  EffectContext,
  EffectResult,
  EffectValidation,
} from '../types/effect.js';
import { movePiece, getPieceAt, isValidPosition } from '../../core/index.js';

// Validierung
function validateTeleport(context: EffectContext): EffectValidation {
  const { state, params } = context;
  
  if (!params.targetPosition || !params.metadata?.fromPosition) {
    return { isValid: false, reason: 'From and To positions required' };
  }
  
  // Prüfe ob Figur an Startposition existiert
  const piece = getPieceAt(
    state.boardState.board,
    params.metadata.fromPosition as any
  );
  
  if (!piece) {
    return { isValid: false, reason: 'No piece at source position' };
  }
  
  return { isValid: true };
}

// Ausführung
function executeTeleport(context: EffectContext): EffectResult {
  const { state, params } = context;
  
  const from = params.metadata?.fromPosition as any;
  const to = params.targetPosition!;
  
  // Bewege Figur
  const newBoard = movePiece(state.boardState.board, from, to);
  
  return {
    newState: {
      ...state,
      boardState: {
        ...state.boardState,
        board: newBoard,
      },
    },
    success: true,
    message: 'Piece teleported',
  };
}

// Effekt-Definition
export const teleportEffect: EffectDefinition = {
  id: 'teleport',
  name: 'Teleport',
  description: 'Instantly move a piece to another square',
  type: 'board-modification',
  timing: 'immediate',
  execute: executeTeleport,
  validate: validateTeleport,
};
```

### Schritt 2: Karte definieren

Füge die Karte in `src/cards/cards/basicCards.ts` hinzu:

```typescript
import { teleportEffect } from '../effects/teleport.js';

export const teleportCard: Card = {
  id: 'teleport',
  name: 'Teleport',
  description: 'Move any piece to an empty square',
  rarity: 'rare',
  cost: { mana: 5 },
  effect: teleportEffect,
  flavorText: 'Space bends to your will.',
};

// In basicCards Array hinzufügen
export const basicCards: Card[] = [
  // ... existing cards
  teleportCard,
];
```

### Schritt 3: Fertig!

Die Karte ist jetzt spielbar:

```typescript
import { playCard, teleportCard } from './cards/index.js';

const result = playCard(state, teleportCard, {
  targetPosition: { row: 5, col: 5 },
  metadata: {
    fromPosition: { row: 1, col: 4 },
  },
}, 'white');
```

## Effekte stapeln

### Mehrere Effekte pro Karte

Nutze `executeEffectStack` für Karten mit mehreren Effekten:

```typescript
// src/cards/effects/comboEffect.ts

import { EffectDefinition } from '../types/effect.js';
import { skipTurnEffect } from './skipTurn.js';
import { spawnPieceEffect } from './spawnPiece.js';

// Karte mit 2 Effekten
export const comboCard: Card = {
  id: 'combo-summon-freeze',
  name: 'Summon & Freeze',
  description: 'Spawn a knight AND skip opponent turn',
  rarity: 'legendary',
  cost: { mana: 8 },
  effect: skipTurnEffect, // Haupt-Effekt
};

// Beim Ausspielen:
import { executeEffectStack } from './cards/effects/effectResolver.js';

const result = executeEffectStack(
  state,
  [spawnPieceEffect, skipTurnEffect],  // Beide Effekte
  [
    { targetPosition: { row: 4, col: 4 }, pieceType: 'knight' },
    {},  // Skip braucht keine params
  ],
  comboCard.id,
  'white'
);
```

### Effekt-Kette

Effekte werden sequenziell ausgeführt. Bei Fehler → Rollback:

```typescript
// Effekt 1: Spawn Knight
// Effekt 2: Skip Turn
// Effekt 3: Extra Move

// Wenn Effekt 2 fehlschlägt:
// → Effekt 1 wird rückgängig gemacht
// → Ursprünglicher State wird zurückgegeben
```

## Effekte verhindern

### Counter-Karten (Placeholder)

```typescript
// In Zukunft: Counter-System

export const counterCard: Card = {
  id: 'counter-spell',
  name: 'Counter',
  description: 'Cancel an opponent card',
  rarity: 'rare',
  cost: { mana: 3 },
  effect: counterEffect,
  // NEW: Welche Effekte können gecountert werden
  metadata: {
    counters: ['spawn-piece', 'teleport'],
  },
};

// Beim Spielen prüfen:
if (canCounterEffect(opponentEffect, counterCard)) {
  // Counter erfolgreich
}
```

### Bedingungen für Effekte

Nutze `requirements` um Effekte einzuschränken:

```typescript
export const restrictedCard: Card = {
  id: 'emergency-only',
  name: 'Emergency Summon',
  description: 'Only when in check',
  rarity: 'uncommon',
  cost: { mana: 2 },
  requirements: {
    requiresCheck: true,      // Nur im Schach
    minTurn: 3,               // Ab Zug 3
    playerColor: 'white',     // Nur für Weiß
  },
  effect: spawnPieceEffect,
};
```

## Persistente Effekte

Effekte mit Dauer (mehrere Runden):

```typescript
// Beispiel: Frozen Piece (3 Runden)

function executeFreezeEffect(context: EffectContext): EffectResult {
  const { state, params } = context;
  
  return {
    newState: {
      ...state,
      boardState: {
        ...state.boardState,
        effects: [
          ...state.boardState.effects,
          {
            id: `freeze-${Date.now()}`,
            type: 'piece_frozen',
            targetPosition: params.targetPosition,
            remainingTurns: 3,  // 3 Runden aktiv
            metadata: { frozen: true },
          },
        ],
      },
    },
    success: true,
    message: 'Piece frozen for 3 turns',
  };
}

// Wird automatisch dekrementiert via processPersistentEffects()
```

## Best Practices

### 1. Effekte sind Pure Functions

```typescript
// ✅ Gut: Pure Function
function executeEffect(context: EffectContext): EffectResult {
  return {
    newState: { ...context.state, /* changes */ },
    success: true,
  };
}

// ❌ Schlecht: Mutation
function executeEffect(context: EffectContext): EffectResult {
  context.state.turnNumber += 1;  // MUTIERT!
  return { newState: context.state, success: true };
}
```

### 2. Validierung trennen

```typescript
// ✅ Gut: Validierung separiert
const effect: EffectDefinition = {
  execute: executeEffect,
  validate: validateEffect,  // Optional aber empfohlen
};

// ❌ Schlecht: Validierung in Execute
function executeEffect(context: EffectContext): EffectResult {
  if (!isValid()) {
    // Validierung sollte VORHER passieren
  }
}
```

### 3. Klare Fehler-Messages

```typescript
// ✅ Gut: Beschreibende Messages
return {
  success: false,
  message: 'Target position is occupied by friendly piece',
};

// ❌ Schlecht: Kryptisch
return {
  success: false,
  message: 'Error',
};
```

## Beispiel-Workflow

```typescript
// 1. Spieler wählt Karte
const card = summonKnightCard;

// 2. UI sammelt Parameter (z.B. durch Klick auf Brett)
const params = {
  targetPosition: { row: 4, col: 4 },
  pieceType: 'knight',
};

// 3. Karte ausspielen
const result = playCard(state, card, params, 'white');

// 4. Prüfe Erfolg
if (result.success) {
  state = result.newState;
  updateUI(state);
  showMessage(result.message);
} else {
  showError(result.message);
}
```

## Erweiterbarkeit

Das System ist designed für:

- ✅ Neue Effekt-Typen
- ✅ Komplexe Effekt-Kombinationen
- ✅ Turn-basierte Effekte
- ✅ Counter-Mechaniken
- ✅ Bedingungsbasierte Aktivierung
- ✅ Effekt-Chains und Combos

Füge einfach neue `EffectDefinition` hinzu und erstelle `Card` Objekte!
