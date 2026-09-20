/**
 * Security rules tests for database.rules.json (Realtime Database).
 *
 * These run against the Firebase emulator, not production. Start it with:
 *   npm run emulator
 * then:
 *   npm run test:rules
 *
 * The cases that matter here are the denials. Before Phase 2 the rules were
 * `auth != null` on both read and write, meaning any signed-in account could
 * read or overwrite any match in the database. Each `assertFails` below is one
 * way that hole is now closed.
 */

import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { ref, get, set, update } from 'firebase/database';
import { readFileSync } from 'node:fs';

const ALICE = 'uid-alice';
const BOB = 'uid-bob';
const MALLORY = 'uid-mallory';
const MATCH = 'match-1';

let testEnv: RulesTestEnvironment;

/** A minimal game node shaped like OnlineGameState. */
const gameNode = (players: Record<string, true>) => ({
  matchId: MATCH,
  players,
  gameState: { gameState: { currentPlayer: 'white' } },
  history: [],
  createdAt: 1_000,
  updatedAt: 1_000,
});

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-deckmate',
    database: {
      rules: readFileSync('database.rules.json', 'utf8'),
      host: '127.0.0.1',
      port: 9000,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearDatabase();
});

/** Seed a game owned by Alice and Bob, bypassing the rules. */
async function seedGame(): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await set(ref(context.database(), `games/${MATCH}`), gameNode({ [ALICE]: true, [BOB]: true }));
  });
}

describe('games/$matchId', () => {
  it('lets a participant read the game', async () => {
    await seedGame();
    const db = testEnv.authenticatedContext(ALICE).database();
    await assertSucceeds(get(ref(db, `games/${MATCH}`)));
  });

  it('denies reads from a signed-in non-participant', async () => {
    await seedGame();
    const db = testEnv.authenticatedContext(MALLORY).database();
    await assertFails(get(ref(db, `games/${MATCH}`)));
  });

  it('denies reads from an unauthenticated client', async () => {
    await seedGame();
    const db = testEnv.unauthenticatedContext().database();
    await assertFails(get(ref(db, `games/${MATCH}`)));
  });

  it('lets a participant update the game state', async () => {
    await seedGame();
    const db = testEnv.authenticatedContext(BOB).database();
    await assertSucceeds(
      update(ref(db, `games/${MATCH}`), {
        gameState: { gameState: { currentPlayer: 'black' } },
        updatedAt: 2_000,
      })
    );
  });

  it('denies writes from a signed-in non-participant', async () => {
    await seedGame();
    const db = testEnv.authenticatedContext(MALLORY).database();
    await assertFails(
      update(ref(db, `games/${MATCH}`), {
        gameState: { gameState: { currentPlayer: 'black' } },
        updatedAt: 2_000,
      })
    );
  });

  it('lets a player create a game that lists them as a participant', async () => {
    const db = testEnv.authenticatedContext(ALICE).database();
    await assertSucceeds(
      set(ref(db, `games/${MATCH}`), gameNode({ [ALICE]: true, [BOB]: true }))
    );
  });

  it('denies creating a game the creator is not part of', async () => {
    const db = testEnv.authenticatedContext(MALLORY).database();
    await assertFails(set(ref(db, `games/${MATCH}`), gameNode({ [ALICE]: true, [BOB]: true })));
  });

  it('denies a game node with no players at all', async () => {
    const db = testEnv.authenticatedContext(ALICE).database();
    await assertFails(set(ref(db, `games/${MATCH}`), { ...gameNode({}), players: {} }));
  });

  it('denies a matchId that disagrees with its path', async () => {
    const db = testEnv.authenticatedContext(ALICE).database();
    const node = { ...gameNode({ [ALICE]: true, [BOB]: true }), matchId: 'some-other-match' };
    await assertFails(set(ref(db, `games/${MATCH}`), node));
  });

  it('denies unknown top-level fields', async () => {
    const db = testEnv.authenticatedContext(ALICE).database();
    const node = { ...gameNode({ [ALICE]: true, [BOB]: true }), injected: 'nope' };
    await assertFails(set(ref(db, `games/${MATCH}`), node));
  });

  it('denies rewriting createdAt', async () => {
    await seedGame();
    const db = testEnv.authenticatedContext(ALICE).database();
    await assertFails(update(ref(db, `games/${MATCH}`), { createdAt: 9_999 }));
  });

  it('denies a participant writing themselves out of the players list', async () => {
    await seedGame();
    const db = testEnv.authenticatedContext(BOB).database();
    await assertFails(update(ref(db, `games/${MATCH}/players`), { [BOB]: null }));
  });
});

describe('status/$uid (presence)', () => {
  it('lets a signed-in user write their own presence', async () => {
    const db = testEnv.authenticatedContext(ALICE).database();
    await assertSucceeds(set(ref(db, `status/${ALICE}`), { state: 'online' }));
  });

  it('denies writing someone else presence', async () => {
    const db = testEnv.authenticatedContext(MALLORY).database();
    await assertFails(set(ref(db, `status/${ALICE}`), { state: 'offline' }));
  });

  it('lets a signed-in user read presence', async () => {
    const db = testEnv.authenticatedContext(BOB).database();
    await assertSucceeds(get(ref(db, `status/${ALICE}`)));
  });

  it('denies presence reads from an unauthenticated client', async () => {
    const db = testEnv.unauthenticatedContext().database();
    await assertFails(get(ref(db, `status/${ALICE}`)));
  });
});
