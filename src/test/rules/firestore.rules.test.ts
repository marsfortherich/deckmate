/**
 * Security rules tests for firestore.rules.
 *
 * Run with `npm run test:rules`, which starts the emulator around them.
 *
 * Two holes these lock shut:
 *
 * 1. Deck privacy. The rules previously granted `allow read` on
 *    `match /users/{document=**}` to any signed-in account. Firestore rules are
 *    permissive-OR, so that recursive match also covered
 *    `users/{uid}/decks/{deckId}` and the narrower owner-only rule below it
 *    could not revoke it - every deck was readable by every account.
 *
 * 2. Match identity. `allow update` was unconditional for either player, so a
 *    participant could rewrite any field, including the participant list.
 */

import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';

const ALICE = 'uid-alice';
const BOB = 'uid-bob';
const MALLORY = 'uid-mallory';
const MATCH = 'match-1';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-deckmate',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

/** Seed users, a deck for Alice, and an Alice-vs-Bob match. */
async function seed(): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', ALICE), { username: 'alice', email: 'alice@test.com' });
    await setDoc(doc(db, 'users', BOB), { username: 'bob', email: 'bob@test.com' });
    await setDoc(doc(db, 'users', ALICE, 'decks', 'deck-1'), {
      name: "Alice's deck",
      cardIds: ['draw-card-1'],
    });
    await setDoc(doc(db, 'matches', MATCH), {
      players: [ALICE, BOB],
      mode: 'unranked',
      status: 'active',
      createdAt: 1_000,
    });
  });
}

describe('users/{uid}/decks - deck privacy', () => {
  it('lets the owner read their own deck', async () => {
    await seed();
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(getDoc(doc(db, 'users', ALICE, 'decks', 'deck-1')));
  });

  it('denies another signed-in user reading it', async () => {
    await seed();
    const db = testEnv.authenticatedContext(MALLORY).firestore();
    await assertFails(getDoc(doc(db, 'users', ALICE, 'decks', 'deck-1')));
  });

  it('denies an opponent listing your decks', async () => {
    await seed();
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(getDocs(collection(db, 'users', ALICE, 'decks')));
  });

  it('denies another user writing to your decks', async () => {
    await seed();
    const db = testEnv.authenticatedContext(MALLORY).firestore();
    await assertFails(
      setDoc(doc(db, 'users', ALICE, 'decks', 'deck-2'), { name: 'injected', cardIds: [] })
    );
  });
});

describe('users/{uid} - lookup still works', () => {
  it('lets a signed-in user query by username', async () => {
    await seed();
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertSucceeds(
      getDocs(query(collection(db, 'users'), where('username', '==', 'alice')))
    );
  });

  it('denies an unauthenticated user reading profiles', async () => {
    await seed();
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'users', ALICE)));
  });

  it('denies writing to another user document', async () => {
    await seed();
    const db = testEnv.authenticatedContext(MALLORY).firestore();
    await assertFails(updateDoc(doc(db, 'users', ALICE), { username: 'stolen' }));
  });
});

describe('matches/{matchId}', () => {
  it('lets a participant read the match', async () => {
    await seed();
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(getDoc(doc(db, 'matches', MATCH)));
  });

  it('denies a non-participant reading the match', async () => {
    await seed();
    const db = testEnv.authenticatedContext(MALLORY).firestore();
    await assertFails(getDoc(doc(db, 'matches', MATCH)));
  });

  it('lets a participant update the game state', async () => {
    await seed();
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertSucceeds(updateDoc(doc(db, 'matches', MATCH), { status: 'finished' }));
  });

  it('denies a non-participant updating the match', async () => {
    await seed();
    const db = testEnv.authenticatedContext(MALLORY).firestore();
    await assertFails(updateDoc(doc(db, 'matches', MATCH), { status: 'finished' }));
  });

  it('denies a participant rewriting the player list', async () => {
    await seed();
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(updateDoc(doc(db, 'matches', MATCH), { players: [ALICE, MALLORY] }));
  });

  it('denies a participant changing the mode', async () => {
    await seed();
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(updateDoc(doc(db, 'matches', MATCH), { mode: 'ranked' }));
  });

  it('denies a participant rewriting createdAt', async () => {
    await seed();
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertFails(updateDoc(doc(db, 'matches', MATCH), { createdAt: 9_999 }));
  });
});
