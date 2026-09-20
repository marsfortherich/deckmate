# Deckmate React UI

React-Frontend für das kartenbasierte Schachspiel.

## Quick Start

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev
```

Öffne dann http://localhost:3000 im Browser.

## Build Commands

```bash
# TypeScript kompilieren (Library)
npm run build

# Vite Dev Server (UI)
npm run dev

# Production Build (UI)
npm run build:ui

# Preview Production Build
npm run preview
```

## Projektstruktur

```
src/ui/
├── components/          # React Components
│   ├── Board.tsx       # Schachbrett
│   ├── Card.tsx        # Karten-Anzeige
│   └── GameView.tsx    # Hauptansicht
├── hooks/              # Custom Hooks
│   └── useGameState.ts # Game State Management
├── App.tsx             # Root Component
├── main.tsx            # Entry Point
└── index.html          # HTML Template
```

## Architektur

### Datenfluss

```
User Interaction
      ↓
Component Event Handler
      ↓
useGameState Hook Action
      ↓
GameController Method
      ↓
Game Engine Logic
      ↓
New State
      ↓
React Re-Render
```

### Komponenten-Hierarchie

```
<App>
  └── <GameView>
        ├── <BoardComponent>
        │     └── <Square> (x64)
        ├── <BoardInfo>
        └── <DualHand>
              ├── <Hand> (Move Cards)
              │     └── <CardComponent> (x3)
              └── <Hand> (Special Cards)
                    └── <CardComponent> (x0-7)
```

## Key Principles

### 1. View vs. Logic Separation

**✅ Components zeigen nur an:**
```tsx
const BoardComponent = ({ board, onSquareClick }) => {
  return <div>{/* Render board */}</div>
};
```

**❌ Components haben KEINE Logik:**
```tsx
// FALSCH!
const BoardComponent = () => {
  const handleMove = () => {
    const newState = applyMove(...); // NEIN!
  };
};
```

### 2. Single Source of Truth

`GameController` hält den gesamten State:

```tsx
// Hook kapselt Controller
const { playerView, playCard } = useGameState('white');

// Component nutzt nur View
<BoardComponent board={playerView.board} />
```

### 3. Immutable State

Alle State-Updates sind immutable:

```tsx
// Controller gibt neue State zurück
const result = controller.playCardAction(...);

// Hook triggert Re-Render mit neuer State
if (result.success) {
  refresh(); // setPlayerView(controller.getPlayerView(player))
}
```

## Verwendung

### Karte spielen

```tsx
// 1. User wählt Karte aus
<CardComponent 
  card={card}
  onClick={() => setSelectedCardId(card.id)}
/>

// 2. User klickt Board-Feld
<BoardComponent 
  onSquareClick={(position) => {
    playCard(selectedCardId, { targetPosition: position });
  }}
/>

// 3. Hook ruft Controller auf
const playCard = (cardId, params) => {
  const result = controller.playCardAction(player, cardId, params);
  if (result.success) refresh();
};
```

### State abfragen

```tsx
const { playerView } = useGameState('white');

// Board anzeigen
<BoardComponent board={playerView.board} />

// Hand anzeigen
<Hand cards={playerView.myHand.moveCards} />

// Turn Info
<div>Turn: {playerView.turnNumber}</div>
<div>Player: {playerView.currentPlayer}</div>
```

## Styling

Aktuell: **Inline CSS** (schnell, kein Setup)

Für Production:
- CSS Modules
- Styled Components
- Tailwind CSS

```tsx
// Inline (current)
<div style={{ 
  backgroundColor: '#1a1a2e',
  padding: '24px' 
}}>

// CSS Modules (future)
<div className={styles.container}>

// Tailwind (future)
<div className="bg-gray-900 p-6">
```

## Testing

```bash
# Unit Tests (TODO)
npm test

# E2E Tests (TODO)
npm run test:e2e
```

Beispiel Test:

```tsx
test('Card click selects card', () => {
  const { getByText } = render(<GameView player="white" />);
  
  fireEvent.click(getByText('Summon Pawn'));
  
  expect(/* card is selected */).toBe(true);
});
```

## Erweiterungen

### Context API für globalen State

```tsx
// GameContext.tsx
export const GameContext = createContext<GameController>(null);

// App.tsx
<GameContext.Provider value={controller}>
  <GameView />
</GameContext.Provider>

// Component
const controller = useContext(GameContext);
```

### React Router für Multiplayer

```tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/game/:gameId" element={<GameView />} />
    <Route path="/lobby" element={<Lobby />} />
  </Routes>
</BrowserRouter>
```

### Websockets für Echzeit

```tsx
const useGameSync = (gameId: string) => {
  useEffect(() => {
    const ws = new WebSocket(`ws://server/${gameId}`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      // Update local state
    };
  }, [gameId]);
};
```

## Dokumentation

- [REACT.md](../REACT.md) - Vollständige Architektur-Dokumentation
- [DATAFLOW.md](../DATAFLOW.md) - Datenfluss-Diagramme
- [CARDS.md](../CARDS.md) - Kartensystem
- [DECKBUILDING.md](../DECKBUILDING.md) - Deckbuilding

## Troubleshooting

**Problem: "Cannot find module"**

```bash
npm install
npm run build
```

**Problem: "Port 3000 already in use"**

```bash
# Ändere Port in vite.config.ts
server: {
  port: 3001,
}
```

**Problem: "Type errors in UI"**

```bash
# TypeScript Check
npm run typecheck
```

## Nächste Schritte

- [ ] Multiplayer-Lobby
- [ ] Deck-Editor UI
- [ ] Animations (Framer Motion)
- [ ] Sound Effects
- [ ] Mobile Responsive Design
- [ ] PWA (Progressive Web App)
