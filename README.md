# Deckmate - Schach mit Karten-System

Eine moderne Schach-Webapp mit kartenbasiertem Zug-System und Spezialeffekten.

## Architektur-Übersicht

### Schichten

```
┌─────────────────────────────────┐
│      UI Layer (React/Vue)       │  ← Präsentation & User Input
├─────────────────────────────────┤
│     Cards System (Module)       │  ← Karten-Logik & Effekte
├─────────────────────────────────┤
│    Core Engine (Pure Logic)     │  ← Game State & Regeln
└─────────────────────────────────┘
```

### Core-Module (`src/core/`)

**Prinzip**: Reine Game-Logik ohne UI-Abhängigkeiten

#### `types/` - Typ-Definitionen
- `common.ts` - Basis-Typen (Piece, Position, Move, Color)
- `board.ts` - Board-Repräsentation & Validierung
- `gameState.ts` - Zentraler GameState

#### `board/` - Brett-Verwaltung
- `initialBoard.ts` - Standard-Startaufstellung
- `boardUtils.ts` - Immutable Board-Operationen

#### `state/` - State-Management
- `initialState.ts` - GameState-Initialisierung
- `stateReducer.ts` - Reine Reducer für State-Änderungen

#### `turn/` - Zugverwaltung
- `turnManager.ts` - Spieler-Wechsel & Historie

## Kern-Prinzipien

### 1. Immutability
Jede State-Änderung erzeugt einen neuen State. Kein direktes Mutieren.

```typescript
// ✅ Korrekt
const newBoard = setPieceAt(board, position, piece);

// ❌ Falsch
board[row][col] = piece;
```

### 2. Pure Functions
Keine Seiteneffekte, gleiche Inputs = gleiche Outputs

```typescript
// ✅ Pure Function
function movePiece(board: Board, from: Position, to: Position): Board {
  // ... erzeugt neues Board
  return newBoard;
}

// ❌ Nicht pure (mutiert)
function movePiece(board: Board, from: Position, to: Position): void {
  board[to.row][to.col] = board[from.row][from.col];
}
```

### 3. Strikte Trennung
- **Core**: Keine UI-Imports, reine Logik
- **Cards**: Nutzt Core, keine UI
- **UI**: Nutzt Core + Cards, präsentiert State

### 4. Erweiterbarkeit
- `BoardEffect[]` für aktive Karten-Effekte
- `Move.cardId` für Karten-Zuordnung
- Hook-fähige Validierung

## Verwendung

```typescript
import { 
  createInitialGameState, 
  applyMove,
  getPieceAt 
} from './core';

// Neues Spiel starten
const state = createInitialGameState();

// Figur bewegen (nach Validierung)
const newState = applyMove(state, move);

// Brett abfragen
const piece = getPieceAt(state.boardState.board, { row: 0, col: 0 });
```

## Nächste Schritte

1. **Move-Validierung** - Regelkonformes Ziehen
2. **Check-Detection** - Schach/Matt-Erkennung
3. **Karten-System** - Effekt-Engine
4. **UI-Layer** - React-Komponenten

## Status

✅ Grundarchitektur  
✅ Board-Repräsentation  
✅ State-Management  
✅ Turn-Management  
✅ Move-Generierung (alle Figuren)  
✅ Move-Validierung (inkl. Schach/Matt)  
✅ Kartensystem (Effect-Resolver, Beispiel-Karten)  
✅ Deckbuilding-System (Templates, Draw/Shuffle/Discard)  
✅ React Frontend (Components, Hooks, State Management)  
⏳ Spezialregeln (Rochade, En Passant)  
⏳ Multiplayer (Websockets, Server-Sync)

## Kartensystem

Das Projekt enthält jetzt ein vollständig modulares Kartensystem:

**Features:**
- 🎴 Karten als Datenobjekte
- ⚙️ Effekte als Pure Functions
- 🔄 Effect-Resolver mit Validierung
- 📚 Effekt-Stacking & Counter-System (Basis)
- 🎯 5 Beispielkarten (Summon, Skip Turn, Extra Move)

**Beispielkarten:**
- **Summon Pawn/Knight** - Spawne Figuren auf leeren Feldern
- **Time Freeze** - Überspringe Gegnerzug
- **Double Time** - Erhalte zusätzlichen Zug
- **Desperate Summon** - Spawne Dame (nur im Schach)

📖 Siehe [CARDS.md](CARDS.md) für Details zum Hinzufügen neuer Karten

## Deckbuilding-System

Das Projekt verfügt über ein vollständiges Deckbuilding-System:

**Features:**
- 📦 Deck-Templates (Balanced, Aggressive, Control)
- 🔨 Custom Deck Building
- ✅ Deck-Validierung (Größe, Kopienlimit)
- 🎲 Zieh-, Misch- und Ablagemechanik
- 🔄 Automatisches Mischen bei leerem Deck
- 🎴 Mulligan-Support (Hand neu ziehen)
- 🌐 **Multiplayer-ready** (immutable, deterministisch)

**Architecture:**
```
DeckGameController
  ├── Deck Management (draw, shuffle, discard)
  ├── Deck Building (templates, validation)
  └── Player Decks (separate deck/hand/discard per player)
```

**Beispiel:**
```typescript
import { DeckGameController, STARTER_BALANCED } from './cards';

// Game mit Decks starten
const game = new DeckGameController(undefined, {
  maxHandSize: 7,
  initialDrawCount: 5,
  drawPerTurn: 1,
  autoShuffleOnEmpty: true,
});

// Karten ziehen
game.drawCardsAction('white', 2);

// Karte spielen
game.playCardAction('white', 0, { targetPosition: { row: 4, col: 4 } });
```

📖 Siehe [DECKBUILDING.md](DECKBUILDING.md) für vollständige Dokumentation

## React Frontend

Das Projekt verfügt über ein vollständiges React-Frontend:

**Features:**
- ⚛️ React 18 + TypeScript
- 🎣 Custom Hooks für State Management
- 🎨 Styled Components (Inline CSS)
- 🔄 Immutable State Pattern
- 🧩 Component-basierte Architektur
- 🎯 **Keine Spiellogik in Components!**

**Architektur:**
```
React UI Layer
  ├── Components (Board, Card, Hand, GameView)
  ├── Custom Hook (useGameState)
  └── GameController (Single Source of Truth)
```

**Datenfluss:**
```
User Click → Event Handler → Hook Action → Controller → 
Engine Logic → New State → refresh() → Re-Render
```

**Beispiel:**
```typescript
// Hook managed Game State
const { playerView, playCard } = useGameState('white');

// Component zeigt nur State an
<BoardComponent 
  board={playerView.board}
  onSquareClick={(pos) => playCard(selectedCard, { targetPosition: pos })}
/>
```

**Starten:**
```bash
npm install
npm run dev    # Vite Dev Server auf http://localhost:3000
```

📖 Siehe [REACT.md](REACT.md) für vollständige Dokumentation:
- Datenfluss-Diagramme
- Event-Handling Pattern
- Re-Render Strategie
- Best Practices

## API-Beispiel

```typescript
import {
  createInitialGameState,
  applyMove,
  generatePieceMoves,
  validateMove,
  isCheckmate,
} from './core';

// Neues Spiel
const state = createInitialGameState();

// Züge generieren
const e2 = { row: 1, col: 4 };
const moves = generatePieceMoves(state.boardState.board, e2);

// Zug validieren
const e4 = { row: 3, col: 4 };
const valid = validateMove(
  state.boardState.board,
  e2,
  e4,
  state.currentPlayer
);

// Zug ausführen
if (valid.isValid) {
  const newState = applyMove(state, {
    from: e2,
    to: e4,
    piece: getPieceAt(state.boardState.board, e2)!,
  });
}

// Schachmatt prüfen
const isMate = isCheckmate(state.boardState.board, 'white');
```

Vollständiges Beispiel: [src/example.ts](src/example.ts)
