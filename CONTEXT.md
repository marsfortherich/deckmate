# Deckmate — Project Context

> Reference document for humans and AI assistants working on this codebase.
> Rewritten 2026-09-20 against the code as it actually exists. Keep it that way:
> if you change architecture, update this file in the same commit.

## What Deckmate is

A chess variant built around a card game. Each turn a player is dealt **move cards**
— generated from the legal chess moves actually available to them — plus **special
cards** drawn from a 20-card deck they built beforehand. A turn consists of
optionally playing special cards to manipulate the game state, then playing one
move card to execute a chess move.

Supported modes: local hot-seat, online multiplayer (Firebase), and a deck builder.
The app ships as a web app, an Electron desktop build, and a Capacitor Android build.

## Architecture

Three layers, with a strict one-way dependency rule:

```
UI (React)  ──uses──>  Cards  ──uses──>  Core (pure chess)
```

- **Core never imports from Cards or UI.**
- **Cards never imports from UI.**
- Violating this is the main thing to watch for in review.

### Core layer — `src/core/`

A complete, dependency-free chess engine. Pure functions, immutable data.

| Path | Contents |
|---|---|
| `types/` | `Board`, `Position`, `Piece`, `Move`, `Color`, `GameState` |
| `board/` | `initialBoard.ts`, `boardUtils.ts` (getPieceAt, setPieceAt, movePiece) |
| `moves/generators/` | One generator per piece type (pawn, knight, bishop, rook, queen, king) |
| `moves/` | `moveGenerator.ts`, `moveValidator.ts` (legality incl. check/checkmate), `moveUtils.ts` |
| `state/` | `initialState.ts`, `stateReducer.ts` (applies moves, castling rights, trap activation) |
| `turn/` | `turnManager.ts` — player switching and history |

### Cards layer — `src/cards/`

| Path | Contents |
|---|---|
| `types/` | `card.ts`, `effect.ts` (`EffectDefinition`, `EffectContext`, `EffectResult`), `handStats.ts` |
| `effects/` | 18 effect implementations + `effectResolver.ts` |
| `moveCards/` | `moveCardGenerator.ts` (legal moves → cards), `handManagerV2.ts` |
| `deck/` | `deckBuilder.ts`, `deckManager.ts`, `deckTypes.ts` |
| `cardLibrary.ts` | The 16 playable special cards and their deck-building limits |
| `enhancedGameController.ts` | **The main controller.** Single source of truth for a match. |

#### The 16 special cards

Card Draw, Tactical Reroll, Wild Card, Reinforcements, Tactical Retreat,
Focus Strategy, Tactical Pressure, Time Freeze, Time Warp, Salvage, Espionage,
Tactical Options, Tactical Reposition, Trap Field, Conversion, Recall.

#### Controller landscape (note the duplication)

Three controllers exist; only one matters for the live app:

- **`enhancedGameController.ts`** — used by the real game (both hooks). 1,563 lines,
  33 public methods. Scheduled to be split up (see Roadmap Phase 1).
- `gameController.ts` — older base controller, still imported by `enhancedGameController`.
- `deckGameController.ts` — reachable only from `example-deckbuilding.ts`. Effectively dead.

Likewise `moveCards/handManager.ts` is superseded by `handManagerV2.ts`.

### UI layer — `src/ui/`

| Path | Contents |
|---|---|
| `App.tsx` | Auth gate — routes to `AuthScreen` or the protected `GameRouter` |
| `routes/GameRouter.tsx` | All in-app routes (menu, friends, deck builder, match flow) |
| `auth/` | `AuthProvider.tsx` (context), `ProtectedRoute.tsx` |
| `components/` | ~25 components — board, cards, dialogs, three game views |
| `hooks/` | `useGameState`, `useEnhancedGameState`, `useSharedGameState`, `useMatch`, `useFriends`, `usePresence` |

Three game views, one per mode:
`EnhancedGameView` (single player) · `MultiplayerGameView` (hot seat) ·
`OnlineMultiplayerGameView` (network, driven by `useSharedGameState`).

Styling is inline CSS objects. There is no CSS framework and no stylesheet.

### Backend — `src/services/` and `functions/`

| File | Responsibility |
|---|---|
| `firebase.ts` | SDK singletons (app, auth, firestore, rtdb, functions) |
| `authService.ts` | Sign up / sign in / sign out |
| `userService.ts` | User documents, usernames, stats |
| `friendService.ts` | Friend requests and lists |
| `presenceService.ts` | Online status via RTDB |
| `matchService.ts` | Match lifecycle: challenge → accept → deck select → active → finish |
| `deckService.ts` | Saved decks (max 5 decks, 20 cards each) |
| `realtimeGameService.ts` | Live game state sync over RTDB at `games/$matchId` |
| `gameStateSerializer.ts` | `EnhancedGameState` ⇄ plain JSON (strips functions) |

`functions/src/index.ts` defines three callable functions — `makeMove`, `playCard`,
`initializeMatch`.

> ⚠️ **These functions do not currently validate anything.** Both `makeMove` and
> `playCard` contain `// TODO: Validate ... using game logic` and simply toggle the
> current player and append to history. The client is authoritative today. Fixing
> this is Phase 2 of the roadmap and is the project's highest-value work.

## Conventions

### Code style
- **TypeScript strict mode** everywhere. Both `tsconfig.json` and `src/ui/tsconfig.json`
  enable `strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`.
- **Immutability** — state updates always produce new objects. Never mutate a board.
- **Pure functions** in Core and in effects. Side effects belong in the controller.
- **`readonly`** used liberally on types to enforce the above.

### Naming
- Files: `camelCase.ts` for logic, `PascalCase.tsx` for components.
- Components and types: `PascalCase`. Functions and variables: `camelCase`.
- Constants: `UPPER_SNAKE_CASE`.

### Language
Comments and UI strings are a mix of German and English — the app's user-facing
text is German. New code comments should be English; user-facing strings German.

## Key design decisions

### 1. Chess and cards are strictly separated
Core is a standalone chess engine with no knowledge that cards exist. This keeps it
testable in isolation and means card bugs can never corrupt move legality.

### 2. Effects communicate via metadata, not direct state surgery
An effect returns `{ newState, success, metadata }`. The controller reads
`metadata.action` and decides what happens. Effects therefore know nothing about
turn management.

```typescript
// effect
return { newState: state, success: true, metadata: { action: 'drawCard', count: 2 } };

// enhancedGameController.handleEffectMetadata()
case 'drawCard': /* controller decides how drawing works */
```

### 3. Some cards end the turn, some don't
- **Continue turn:** `drawCard`, `rerollMoves`, `drawExtraMoves`, `freeMove`,
  `focusStrategy`, `opponentDrawLess`
- **End turn:** move cards, spawn, skip turn, and all board modifications
  (swap, trap, convert)
- **Require a selection step first:** `recoverCards` (Salvage), `activateUsedCard` (Recall)

Governed by `shouldSpecialCardEndTurn()` and the `continueActions` list.

### 4. Interactive cards enter a "pending" mode
Cards needing board or card input set one of three pending states, and the UI
renders a banner or dialog until it resolves:

| State | Used by |
|---|---|
| `pendingBoardAction` | Tactical Reposition (swap), Trap Field, Conversion |
| `pendingCardSelection` | Salvage, Recall |
| `pendingPieceTypeChoice` | Focus Strategy |

Flow: play card → enter mode → show banner/dialog → card selection disabled →
execute → exit mode → end turn if applicable.

### 5. Traps are public information
Traps live in `boardState.effects`, render as a 💣 overlay, and destroy the first
piece to enter the square. Activation is checked in `applyMove()` and in every
effect that relocates a piece. Both players can see them — there is no hidden
trap state by design.

### 6. Focus Strategy always fills the hand
If the focused piece type yields fewer moves than the draw count, the remainder is
filled with random legal moves. This guarantees a playable hand and prevents dead turns.

## Known issues

1. **Online multiplayer is client-authoritative.** Cloud Functions do not validate
   moves or card plays.
2. **Hidden information is not hidden.** `gameStateSerializer` writes *both* players'
   hands and decks into one RTDB blob that both clients receive.
3. **RTDB rules are wide open.** `database.rules.json` grants read and write on
   `games/$matchId` to *any* authenticated user, not just the two players.
4. **No draw conditions.** Checkmate is detected; stalemate, insufficient material,
   threefold repetition and the 50-move rule are not.
5. **Thin test coverage.** 16 tests against ~21,800 lines.
6. **Noisy logging.** ~430 `console.log` calls, some of which print hand contents.
7. **Single 997 kB JS bundle.** No code splitting.
8. **Move card generation can be slow** when many legal moves exist.

## Development

### Commands

```bash
npm run dev            # Vite dev server on http://localhost:3000
npm run typecheck      # tsc over core + UI (two configs)
npm run lint           # ESLint
npm run format         # Prettier
npm run test:run       # Vitest, single run
npm run build:ui       # Production web bundle -> dist/ui
npm run emulator       # Firebase emulators
npm run electron:build # Desktop build
```

CI (`.github/workflows/ci.yml`) runs typecheck, lint, test and build on every push
and PR to `main`, plus a separate Cloud Functions build.

### Setup
Copy `.env.example` to `.env` and fill in Firebase credentials. `.env` is gitignored
and must never be committed — this repository is public.

### Adding a new card

1. **Write the effect** in `src/cards/effects/newEffect.ts` as an `EffectDefinition`
   returning `{ newState, success, metadata }`.
2. **Export it** from `src/cards/effects/index.ts`.
3. **Register the card** in `src/cards/cardLibrary.ts` with rarity, cost, `maxCopies`
   and category.
4. **Handle the metadata** in `enhancedGameController.handleEffectMetadata()`, and add
   the action to `continueActions` if it should not end the turn.
5. **If interactive**, add the mode to the game views: banner, board interaction, and
   the card-selection disable logic.

### Adding a game mode
Create the component in `src/ui/components/`, add a hook if it needs its own state,
register the route in `src/ui/routes/GameRouter.tsx`, and link it from `MainMenu.tsx`.

## Roadmap

Tracked in full in [ROADMAP.md](ROADMAP.md).

- **Phase 0 — Foundation** ✅ git, ignore rules, green tests, lint, CI, this document
- **Phase 1 — Debt cleanup** — logger, delete dead controllers, split the 1,563-line
  god object, reduce `any`
- **Phase 2 — Fix multiplayer** — split public/private state, lock down security rules,
  make Cloud Functions authoritative, server-side RNG
- **Phase 3 — Finishable games** — draw conditions, timers, reconnect, balance, polish
- **Phase 4 — Reach** — AI opponent, code splitting, replays, mobile release

## Related documentation

`README.md` · `CARDS.md` · `DECKBUILDING.md` · `REACT.md` · `DATAFLOW.md` ·
`REFACTORING.md` · `BUILD_GUIDE.md` · `FRIENDS.md` · `AUTH_TESTING.md` ·
`FIREBASE_TESTING.md` · `MATCH_TESTING.md`
