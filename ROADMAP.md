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

## Phase 1 — Debt cleanup

Goal: make the codebase small enough to reason about before changing its architecture.

- [ ] **Logger module.** Replace ~430 `console.log` calls with a `logger` gated on
      `import.meta.env.DEV`. Delete outright the ones in `realtimeGameService.ts` that
      print hand and deck contents.
- [ ] **Delete dead code.** `deckGameController.ts` and `moveCards/handManager.ts` are
      superseded. Move `src/example-*.ts` and `src/test-*.ts` out of `src/` into
      `scripts/` so they stop reading as application source.
- [ ] **Split `enhancedGameController.ts`** (1,563 lines, 33 public methods). Natural
      seams: turn lifecycle · effect-metadata dispatch · card-selection flow ·
      board-action flow.
- [ ] **Reduce `any`.** ~98 warnings, concentrated in the sync layer where they hide
      real shape mismatches.
- [ ] **Fix the 3 `react-hooks/exhaustive-deps` warnings** — these are latent stale-closure bugs.

---

## Phase 2 — Fix multiplayer  ← the highest-value work

Online play today is client-authoritative and leaks hidden information. Three separate
problems, best fixed together.

- [ ] **Split game state into public and private nodes.**
      `games/$id/public` (board, turn, history) readable by both players;
      `games/$id/private/$uid` (your hand, your deck order) readable only by you.
      Requires reworking `gameStateSerializer.ts`, which currently emits one blob
      containing `whiteHand`, `blackHand`, `whiteDeck` and `blackDeck`.
- [ ] **Lock down `database.rules.json`.** It currently grants read *and write* on
      `games/$matchId` to every authenticated user. Restrict to the two players.
- [ ] **Tighten the Firestore `matches` rules** — `allow update` is unconditional for
      both players, so either can rewrite any field including the result.
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
