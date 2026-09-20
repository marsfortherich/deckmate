# React Frontend Integration

Dieses Dokument erklärt die Integration der Game-Engine mit React.

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────┐
│              React UI Layer                     │
├─────────────────────────────────────────────────┤
│  Components (Board, Card, GameView)             │
│       ↓                    ↑                     │
│  useGameState Hook                               │
│       ↓                    ↑                     │
│  GameController (Single Source of Truth)        │
│       ↓                    ↑                     │
│  Game Engine (core + cards)                     │
└─────────────────────────────────────────────────┘
```

## Grundprinzipien

### 1. **Strikte Trennung: View vs. Logic**

```typescript
// ✅ RICHTIG: Component NUR für Anzeige
const BoardComponent: React.FC<BoardProps> = ({ board, onSquareClick }) => {
  return (
    <div>
      {board.map(row => /* render squares */)}
    </div>
  );
};

// ❌ FALSCH: Spiellogik in Component
const BoardComponent = () => {
  const [gameState, setGameState] = useState(initialState);
  
  const handleMove = (from, to) => {
    // NEIN! Logik gehört in Controller!
    const newState = applyMove(gameState, ...);
    setGameState(newState);
  };
};
```

**Regel:** Components sind **dump** - sie zeigen nur Daten an und feuern Events.

### 2. **Single Source of Truth**

Der `GameController` ist die **einzige** Quelle für Game State:

```typescript
// Controller hält State
class GameController {
  private state: GameStateWithHands;
  
  public getPlayerView(player: Color): PlayerView {
    // Gibt immutable View zurück
    return { ...view };
  }
}

// Hook abonniert Controller
function useGameState(player: Color) {
  const controller = useMemo(() => new GameController(), []);
  const [playerView, setPlayerView] = useState(() => 
    controller.getPlayerView(player)
  );
  
  // State kommt IMMER vom Controller
  const refresh = () => setPlayerView(controller.getPlayerView(player));
}
```

### 3. **Immutability & React State**

Game-Engine ist immutable → React State Updates sind einfach:

```typescript
// Controller gibt neue State zurück
const result = controller.playCardAction(player, cardId, params);

// Hook nimmt neue State und triggert Re-Render
if (result.success) {
  refresh(); // setPlayerView(controller.getPlayerView(player))
}
```

## Datenfluss

### Initialisierung

```
1. App rendert
   ↓
2. GameView wird gemountet
   ↓
3. useGameState() wird aufgerufen
   ↓
4. GameController wird erstellt (useMemo)
   ↓
5. Initialer PlayerView wird geholt
   ↓
6. Component rendert mit initialem State
```

### User-Interaktion (Karte spielen)

```
User klickt Karte
   ↓
1. onClick Handler in Card Component
   ↓
2. onCardClick(cardId, index) → Parent (GameView)
   ↓
3. handleCardSelect() in GameView
   ↓
4. Lokaler UI-State: setSelectedCardId(cardId)
   ↓
5. Re-Render: Karte wird als "selected" angezeigt
   ↓

User klickt Board-Square
   ↓
6. onSquareClick(position) in Board Component
   ↓
7. handleSquareClick() in GameView
   ↓
8. playCard(cardId, { targetPosition }) vom Hook
   ↓
9. controller.playCardAction(player, cardId, params)
   ↓
10. Controller führt Logik aus
   ↓
11. Controller returned ActionResult
   ↓
12. Hook: refresh() → setPlayerView(neuer View)
   ↓
13. React Re-Render: Board & Hand werden updated
```

**Visualisierung:**

```
Component           Hook               Controller         Engine
────────────────────────────────────────────────────────────────
onClick
  │
  ├──→ playCard()
        │
        ├──→ controller.playCardAction()
                        │
                        ├──→ applyMove()
                        │     validateMove()
                        │     updateState()
                        │
                        ←──── ActionResult
        │
        ←──── success
  │
  ├──→ refresh()
        │
        ├──→ getPlayerView()
        │      │
        │      ←──── PlayerView
        │
        ├──→ setPlayerView()
        │
←────── Re-Render
```

## Event-Handling

### Event-Typen

**1. UI-Events (Lokaler State)**

Ändern nur UI-Darstellung, keine Game-Logik:

```typescript
const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

const handleCardSelect = (cardId: string) => {
  setSelectedCardId(cardId); // Nur UI-Highlight
};
```

**2. Game-Events (Controller Actions)**

Ändern Game-State via Controller:

```typescript
const handlePlayCard = (cardId: string, params: EffectParams) => {
  playCard(cardId, params); // Hook ruft Controller auf
};
```

### Event-Delegation Pattern

```typescript
// Component: Nur Event weiterleiten
const CardComponent = ({ card, onClick }) => {
  return <div onClick={() => onClick(card.id)}>...</div>;
};

// Parent: Event-Logik orchestrieren
const Hand = ({ cards, onCardClick }) => {
  return cards.map((card, i) => (
    <CardComponent 
      card={card} 
      onClick={(id) => onCardClick(id, i)} 
    />
  ));
};

// Container: Event → Action
const GameView = () => {
  const { playCard } = useGameState('white');
  
  const handleCardClick = (cardId: string, index: number) => {
    // Lokaler State für UI
    setSelectedCard(cardId);
    // Später: Game Action
    // playCard(cardId, params);
  };
};
```

## Re-Render Strategie

### Was triggert Re-Renders?

**1. Game State Änderungen**

```typescript
// Hook refresht → Component re-rendert
const refresh = useCallback(() => {
  const newView = controller.getPlayerView(player);
  setPlayerView(newView); // ← Re-Render!
}, [controller, player]);
```

**2. Lokaler UI-State**

```typescript
// Karte auswählen → nur UI re-rendert
setSelectedCardId(cardId); // ← Re-Render!
```

### Optimierungen

**1. useMemo für Controller**

```typescript
// Controller nur EINMAL erstellen
const controller = useMemo(() => new GameController(), []);
```

**2. useCallback für Event-Handler**

```typescript
// Handler nicht bei jedem Render neu erstellen
const playCard = useCallback((cardId, params) => {
  // ...
}, [controller, player, refresh]);
```

**3. React.memo für Components** (optional)

```typescript
// Component nur re-rendern wenn Props ändern
export const CardComponent = React.memo<CardProps>(({ card, onClick }) => {
  // ...
});
```

### Re-Render Fluss

```
State Change (setPlayerView)
   ↓
GameView re-rendert
   ↓
Prüft: Hat sich playerView geändert?
   ↓
Ja → Re-Render Children:
   ├─→ BoardComponent (neues board prop)
   ├─→ DualHand (neue cards prop)
   └─→ BoardInfo (neue stats)
   ↓
Nein → Keine Children re-rendered
```

## Best Practices

### ✅ DO

```typescript
// Controller in Hook kapseln
const { playerView, playCard } = useGameState('white');

// Component zeigt nur View an
<BoardComponent board={playerView.board} />

// Events delegieren an Hook-Actions
onClick={() => playCard(cardId, params)}

// Immutable Operations
const result = controller.playCardAction(...);
// Controller State ändert sich intern
```

### ❌ DON'T

```typescript
// NICHT: Direkter Zugriff auf Controller
const controller = new GameController();
controller.playCardAction(...);

// NICHT: Spiellogik in Component
const handleMove = () => {
  const newBoard = movePiece(board, from, to);
  setBoard(newBoard);
};

// NICHT: State manuell ändern
playerView.board[0][0] = null; // IMMUTABLE!

// NICHT: Mehrere Controller
const controller1 = useGameController();
const controller2 = useGameController(); // Desync!
```

## Datenflusszusammenfassung

### Read Path (State → UI)

```
GameController (Source of Truth)
   ↓
getPlayerView()
   ↓
PlayerView (immutable snapshot)
   ↓
useGameState Hook (useState)
   ↓
React Component Props
   ↓
DOM Rendering
```

### Write Path (User Action → State)

```
User Interaction (Click)
   ↓
Event Handler (Component)
   ↓
Action Function (Hook)
   ↓
Controller Method
   ↓
Game Engine Logic
   ↓
New State
   ↓
refresh() → getPlayerView()
   ↓
setPlayerView() → Re-Render
```

### Async Pattern (für Multiplayer)

```typescript
// Zukünftige Erweiterung: Server-Sync
const playCard = useCallback(async (cardId, params) => {
  // 1. Optimistic Update (optional)
  // setPlayerView(predictedView);
  
  // 2. Server Request
  const result = await api.playCard(player, cardId, params);
  
  // 3. Server Response → Update
  if (result.success) {
    refresh();
  } else {
    // Rollback optimistic update
  }
}, [player, refresh]);
```

## Beispiel: Vollständiger Flow

```typescript
// 1. User sieht Board
<GameView player="white" />

// 2. Hook liefert State
const { playerView, playCard } = useGameState('white');

// 3. Component rendert Board
<BoardComponent 
  board={playerView.board}
  onSquareClick={handleSquareClick}
/>

// 4. User klickt Karte
<CardComponent 
  card={card}
  onClick={() => handleCardSelect(card.id)}
/>

// 5. Lokaler State: Karte selected
setSelectedCardId(card.id);

// 6. User klickt Board-Feld
onSquareClick(position)
  ↓
handleSquareClick(position)
  ↓
playCard(selectedCardId, { targetPosition: position })
  ↓
controller.playCardAction(player, cardId, params)
  ↓
// Engine führt Zug aus
  ↓
refresh()
  ↓
setPlayerView(controller.getPlayerView(player))
  ↓
// React re-rendert mit neuem State
```

## Testing-Strategie

```typescript
// Unit Tests: Engine (keine React)
test('move validation', () => {
  const state = createInitialGameState();
  const result = validateMove(state, from, to);
  expect(result.isValid).toBe(true);
});

// Integration Tests: Hook
test('useGameState updates view', () => {
  const { result } = renderHook(() => useGameState('white'));
  
  act(() => {
    result.current.playCard('card-id', {});
  });
  
  expect(result.current.playerView.turnNumber).toBe(2);
});

// Component Tests: UI
test('Card renders and handles click', () => {
  const onClick = jest.fn();
  render(<CardComponent card={mockCard} onClick={onClick} />);
  
  fireEvent.click(screen.getByText('Summon Pawn'));
  expect(onClick).toHaveBeenCalled();
});
```

## Nächste Schritte

1. **Context API** - Globaler Game State
2. **React Router** - Multiplayer Lobbies
3. **Websockets** - Echzeit-Synchronisation
4. **Redux/Zustand** - Fortgeschrittenes State Management (optional)
5. **React Query** - Server-State Caching
