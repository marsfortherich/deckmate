# Datenfluss-Architektur: Kartenbasiertes Schach

## Übersicht

Das System trennt strikt zwischen **Game-Logik** und **UI-Layer** durch den **Game Controller**.

```
┌─────────────────────────────────────────────────────────┐
│                     UI Layer                            │
│  (React/Vue/etc - kennt NUR PlayerView)                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ playCardAction()
                     │ getPlayerView()
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Game Controller                            │
│  - Orchestriert alles                                   │
│  - UI Gateway (kein direkter State-Zugriff)            │
│  - Verwaltet Hände + GameState                         │
└──┬──────────────────┬──────────────────┬────────────────┘
   │                  │                  │
   ▼                  ▼                  ▼
┌──────────┐   ┌──────────┐      ┌─────────────┐
│  Chess   │   │  Card    │      │    Hand     │
│  Engine  │   │  System  │      │  Manager    │
└──────────┘   └──────────┘      └─────────────┘
```

## Schritt-für-Schritt Datenfluss

### 1. Spiel-Start

```typescript
// UI erstellt Controller
const controller = new GameController();

// UI holt initiale View
const view = controller.getPlayerView('white');
// view = {
//   currentPlayer: 'white',
//   myHand: { moveCards: [3 Karten], specialCards: [] },
//   canPlayCard: true
// }
```

**Interner Ablauf:**
1. Controller erstellt `GameState` (Schach-Engine)
2. Controller erstellt `PlayerHand` für beide Spieler
3. Generiert Zugkarten aus legalen Zügen → `generateMoveCards()`
4. Zieht 3 Zugkarten für Weiß → `drawMoveCards()`

---

### 2. Spieler zieht (via Zugkarte)

```typescript
// UI: Spieler klickt auf Zugkarte "Knight e2 → f4"
const result = controller.playCardAction(
  'white',           // Spieler
  'move-e2-f4',     // Karten-ID
  {},               // Keine params für Zugkarten
  true              // isMoveCard = true
);

// result = {
//   success: true,
//   message: "Move executed: e2 to f4",
//   newView: { ... }  // Aktualisierte View
// }
```

**Interner Ablauf:**

```
1. Controller.playCardAction()
   │
   ├─> Validiere: Spieler am Zug? ✓
   │
   ├─> playCardFromHand() → Entferne Karte aus Hand
   │   │
   │   └─> newHand = { moveCards: [2 übrig] }
   │
   ├─> playCard() → Effect-Resolver
   │   │
   │   ├─> Validiere Karte
   │   │
   │   └─> executeEffect()
   │       │
   │       └─> applyMove() → Schach-Engine
   │           │
   │           └─> newGameState mit Zug ausgeführt
   │
   └─> handleTurnChange()
       │
       ├─> clearMoveCards(whiteHand) → Alte Zugkarten weg
       │
       └─> drawMoveCards(blackHand) → Neue Zugkarten für Schwarz
           │
           ├─> generateMoveCards() → Alle legalen Züge
           │   │
           │   └─> [20 mögliche Züge]
           │
           └─> Ziehe 3 zufällige → blackHand
```

---

### 3. Spieler spielt Spezialkarte

```typescript
// UI: Spieler klickt auf "Summon Knight"
// UI lässt Spieler Zielfeld wählen (z.B. d4)

const result = controller.playCardAction(
  'black',
  'summon-knight',
  {
    targetPosition: { row: 3, col: 3 },  // d4
    pieceType: 'knight'
  },
  false  // isMoveCard = false (Spezialkarte!)
);
```

**Interner Ablauf:**

```
1. Controller.playCardAction()
   │
   ├─> playCardFromHand() → Entferne aus specialCards
   │
   ├─> playCard() → Effect-Resolver
   │   │
   │   ├─> Validiere: Position frei? ✓
   │   │
   │   └─> executeEffect() → spawnPieceEffect
   │       │
   │       └─> setPieceAt() → Springer auf d4
   │
   └─> KEIN Zug-Wechsel (Spezialkarten wechseln nicht!)
```

**WICHTIG:** Spezialkarten triggern KEINEN Turn-Change!

---

### 4. UI aktualisiert sich

```typescript
// Nach jeder Aktion:
if (result.success) {
  updateUI(result.newView);
  // newView enthält:
  // - Aktualisierte Hand
  // - Aktueller Spieler
  // - Kann Karte spielen?
}
```

**Was UI SIEHT:**

```typescript
interface PlayerView {
  currentPlayer: 'white' | 'black';
  turnNumber: number;
  status: 'active' | 'check' | 'checkmate';
  myHand: {
    moveCards: Card[];      // 0-5 Zugkarten
    specialCards: Card[];   // 0-3 Spezialkarten
  };
  opponentHandSize: number;  // Nur Anzahl, nicht Inhalt!
  canPlayCard: boolean;
}
```

**Was UI NICHT sieht:**
- ❌ Gesamte Brett-Position
- ❌ Alle legalen Züge
- ❌ Gegner-Hand (nur Anzahl)
- ❌ Interner GameState

---

## Datenfluss-Diagramme

### Zugkarten-Generierung

```
GameState.board
    │
    ├─> generateMoveCards(board, color)
    │   │
    │   ├─> Für jede Figur:
    │   │   │
    │   │   ├─> generatePieceMoves() → [Positionen]
    │   │   │
    │   │   └─> createMoveCard() → Card
    │   │       │
    │   │       └─> {
    │   │             name: "Knight e2 → f4",
    │   │             effect: executeMoveEffect
    │   │           }
    │   │
    │   └─> [Array von Move-Cards]
    │
    └─> drawMoveCards() → Zufällige Auswahl
        │
        └─> PlayerHand: { moveCards: [3 Karten] }
```

### Karte spielen

```
UI klickt Karte
    │
    └─> controller.playCardAction(cardId)
        │
        ├─> Validierung (Spieler am Zug?)
        │
        ├─> Karte aus Hand entfernen
        │
        ├─> Effect-Resolver
        │   │
        │   ├─> Karten-Effect ausführen
        │   │   │
        │   │   └─> GameState transformieren
        │   │
        │   └─> Ergebnis
        │
        ├─> Falls Zugkarte: Turn-Change
        │   │
        │   ├─> Alte Zugkarten löschen
        │   │
        │   └─> Neue Zugkarten ziehen
        │
        └─> PlayerView zurück an UI
```

### Turn-Change Zyklus

```
Weiß spielt Zugkarte
    │
    └─> applyMove() → currentPlayer = 'black'
        │
        └─> handleTurnChange()
            │
            ├─> clearMoveCards(whiteHand)
            │   └─> whiteHand.moveCards = []
            │
            └─> drawMoveCards(blackHand)
                │
                ├─> generateMoveCards(board, 'black')
                │   └─> [Alle legalen Züge von Schwarz]
                │
                └─> blackHand.moveCards = [3 zufällige]
```

---

## Spezialkarten-Effekte

### Beispiel: Time Freeze

```
controller.playCardAction('white', 'time-freeze', {}, false)
    │
    └─> playCard(timeFreezeCard)
        │
        └─> skipTurnEffect.execute()
            │
            ├─> state.boardState.effects.push({
            │     type: 'turn_skip',
            │     remainingTurns: 1
            │   })
            │
            └─> return newState
```

**Game-Loop muss prüfen:**

```typescript
// In echter Implementierung:
if (hasSkipTurnEffect(state, currentPlayer)) {
  // Überspringe Zug
  state = switchPlayer(state);
}
```

### Beispiel: Spawn Knight

```
controller.playCardAction('black', 'summon-knight', {
  targetPosition: { row: 4, col: 4 },
  pieceType: 'knight'
}, false)
    │
    └─> spawnPieceEffect.execute()
        │
        ├─> Validiere: Position frei? ✓
        │
        ├─> setPieceAt(board, pos, newKnight)
        │
        └─> return newState (mit Springer)
```

**Resultat:** Brett verändert, ABER kein Turn-Change!

---

## Sicherheit & Kapselung

### ✅ Was UI kann:

```typescript
controller.getPlayerView('white');     // Eigene View holen
controller.playCardAction(...);         // Karte spielen
controller.drawSpecialCard(...);        // Spezialkarte ziehen
```

### ❌ Was UI NICHT kann:

```typescript
state.gameState.currentPlayer = 'white';  // ❌ Kein direkter Zugriff
state.whiteHand.moveCards = [...];        // ❌ State ist private
generateMoveCards(...);                    // ❌ Interne Funktion
```

**Kapselung:**
- `state` ist `private` im Controller
- UI bekommt nur `PlayerView` (Read-Only)
- Alle Mutations via `playCardAction()`

---

## Erweiterbarkeit

### Neue Spezialkarte hinzufügen

1. **Effect erstellen** (wie vorher)
2. **Card definieren**
3. **Fertig!** Controller handled alles automatisch

### Regel-Modifikation via Karte

```typescript
// Beispiel: "Pawns can move backwards for 2 turns"

const reversePawnsEffect: EffectDefinition = {
  execute: (context) => ({
    newState: {
      ...context.state,
      boardState: {
        ...context.state.boardState,
        effects: [
          ...context.state.boardState.effects,
          {
            type: 'reverse_pawns',
            remainingTurns: 2,
          }
        ]
      }
    },
    success: true
  })
};

// Move-Generator muss dann BoardEffects prüfen!
```

---

## Zusammenfassung

**Datenfluss:**
```
UI → Controller → Effect-Resolver → Game-Engine → neuer State
                  ↓
              Hand-Manager
                  ↓
          Move-Card-Generator
```

**Vorteile:**
- ✅ UI kennt nur PlayerView (Security)
- ✅ Logik isoliert testbar
- ✅ Regeländerungen via Effekte
- ✅ Keine direkte State-Manipulation
- ✅ Erweiterbar ohne UI-Änderung
