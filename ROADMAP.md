# Deckmate Roadmap

Last updated: 2026-09-20

Ordered by dependency, not by appeal. Each phase assumes the one before it is done.

---

## Phase 0 — Make the project safe to change ✅

Completed 2026-09-20.

- [x] Initialise git and push to `marsfortherich/deckmate`
- [x] Write a real `.gitignore` covering `.env`, logs, build output, Android artifacts
- [x] Remove the duplicate `.env.local` and stray `database-debug.log` / `firestore-debug.log`
- [x] Add the missing `VITE_FIREBASE_DATABASE_URL` to `.env.example`
- [x] Fix the failing `AuthProvider` suite — `src/services/firebase.ts` is now mocked
      globally in `src/test/setup.ts`, so no test needs live credentials
- [x] Add ESLint (flat config) and Prettier
- [x] Fix all 10 real lint errors; existing debt (`any`, `console`) is warn-only
- [x] Extend `npm run typecheck` to cover `src/ui`, which the root tsconfig excluded
- [x] Add GitHub Actions CI: typecheck, lint, test, build + Cloud Functions build
- [x] Rewrite the corrupted `CONTEXT.md`

---

## Phase 1 — Debt cleanup ✅

Completed 2026-09-20.

- [x] **Logger module.** `src/utils/logger.ts`; all 123 `console.log` calls in `src/`
      now go through `logger.debug`, compiled out of production. The RTDB
      shape-probe blocks that logged both players' hand keys are gone.
- [x] **Delete dead code.** Removed `deckGameController.ts` and
      `moveCards/handManager.ts` (no importers) plus their demos; moved the eight dev
      scripts to `scripts/`. Note `gameController.ts` is **not** dead — it backs
      `useGameState`.
- [x] **Split `enhancedGameController.ts`** 1,563 → 1,002 lines, with
      `controller/state.ts`, `controller/effectMetadata.ts` and
      `controller/turnLifecycle.ts` extracted as pure functions.
- [x] **Reduce `any`.** 96 → 51 warnings. `SerializedGameState` now declares `Color`
      instead of `string`, removing nine `as any` casts in the sync layer, and 32
      `catch (e: any)` blocks use the new `src/utils/errors.ts` helpers.
- [x] **Fix the 3 `react-hooks/exhaustive-deps` warnings** — two were live
      stale-state bugs (DeckBuilder, MultiplayerGameView).
- [x] **Added 14 characterisation tests** for the controller before refactoring it.

Deferred to Phase 2, where this code is being reworked anyway: the remaining 51
`any` warnings, which are dynamic Firebase JSON reconstruction in
`gameStateSerializer` and test mocks; and the card-selection / board-action
extractions from the controller.

---

## Phase 2 — Fix multiplayer  ← the highest-value work

Online play today is client-authoritative and leaks hidden information. Three separate
problems, best fixed together.

- [ ] **Split game state into public and private nodes.**
      `games/$id/public` (board, turn, history) readable by both players;
      `games/$id/private/$uid` (your hand, your deck order) readable only by you.
      Requires reworking `gameStateSerializer.ts`, which currently emits one blob
      containing `whiteHand`, `blackHand`, `whiteDeck` and `blackDeck`.
- [x] **Lock down `database.rules.json`.** Read and write on `games/$matchId` now
      require the caller to appear in a `players` map written into the node at
      creation. 16 emulator-backed tests in `src/test/rules/`.
- [x] **Tighten the Firestore `matches` rules** — update now requires `players`,
      `mode` and `createdAt` to be unchanged.
- [x] **Close the deck-read leak** (found during this work, not originally listed).
      `match /users/{document=**}` granted read on every subcollection to every
      authenticated account, so all decks were public. Scoped to `users/{userId}`.
      14 Firestore rules tests.
- [ ] **Move email/username lookup behind a Cloud Function.** Any authenticated
      account can still read any user document, which exposes stored emails.
      `findUserByEmail` / `findUserByUsername` depend on that read.
- [ ] **Make the Cloud Functions authoritative.** Extract `src/core` + `src/cards` into
      a shared workspace package that `functions/` can import, then implement the two
      `// TODO: Validate ...` bodies in `functions/src/index.ts` against the real engine.
      The client becomes a renderer that proposes actions.
- [ ] **Server-side RNG** for shuffles and draws. The client currently decides what it draws.

---

## Phase 3 — Make it a game people can finish

- [ ] **Draw conditions:** stalemate, insufficient material, threefold repetition,
      50-move rule. Checkmate detection already works.
- [ ] **Turn timers** — an online match currently has no way to end except a win.
- [ ] **Disconnect / reconnect handling.**
- [ ] **Balance pass** on the 16 cards using logged match data. `Espionage`, `Recall`
      and `Salvage` are the likeliest sources of degenerate loops.
- [ ] **UX polish:** card-play animations, toast notifications, hover previews,
      clearer deck counts, board coordinates.

---

## Phase 4 — Reach

- [ ] **AI opponent.** The legal-move generator is complete, so a minimax/alpha-beta
      baseline over `core` plus a heuristic card policy gives a practice mode and
      unblocks solo play.
- [ ] **Code-split the 997 kB bundle.** Route-level `import()`; the deck builder and
      game views are the obvious splits.
- [ ] **Replay system** from the `history` array RTDB already records.
- [ ] **Ship Android** (`npx cap sync`, signing config).
- [ ] Decide whether the Electron desktop build stays or web-only wins.

---

## Running throughout — test coverage

16 tests against ~21,800 lines is the quiet risk behind every phase above.
Priority order:

1. `core/moves` generators and `moveValidator` — pure, trivially testable, highest blast radius
2. Each of the 18 effects in isolation
3. `gameStateSerializer` round-trips
4. `enhancedGameController` turn lifecycle
