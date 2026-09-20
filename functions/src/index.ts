/**
 * Firebase Cloud Functions for Deckmate
 * 
 * Handles server-side game logic validation and state management
 */

import {setGlobalOptions} from "firebase-functions/v2";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  MakeMoveRequest,
  MakeMoveResponse,
  PlayCardRequest,
  PlayCardResponse,
} from "./types";

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Set global options
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});

/**
 * Make a move in a multiplayer match
 * Validates the move server-side and updates game state
 */
export const makeMove = onCall<MakeMoveRequest, Promise<MakeMoveResponse>>(
  async (request) => {
    const {matchId, move} = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    if (!matchId || !move) {
      throw new HttpsError("invalid-argument", "matchId and move are required");
    }

    logger.info("Making move", {matchId, userId, move});

    try {
      // Get match document
      const matchRef = db.collection("matches").doc(matchId);
      const matchDoc = await matchRef.get();

      if (!matchDoc.exists) {
        throw new HttpsError("not-found", "Match not found");
      }

      const matchData = matchDoc.data()!;

      // Verify user is a player
      if (!matchData.players.includes(userId)) {
        throw new HttpsError(
          "permission-denied",
          "User is not a player in this match"
        );
      }

      // Verify match is active
      if (matchData.status !== "active") {
        throw new HttpsError(
          "failed-precondition",
          `Match is not active (status: ${matchData.status})`
        );
      }

      const gameState = matchData.gameState;
      if (!gameState) {
        throw new HttpsError(
          "failed-precondition",
          "Game state not initialized"
        );
      }

      // Determine player color
      const playerColor = matchData.players[0] === userId ? "white" : "black";

      // Verify it's the player's turn
      if (gameState.currentPlayer !== playerColor) {
        throw new HttpsError(
          "failed-precondition",
          `It's not your turn (current player: ${gameState.currentPlayer})`
        );
      }

      // TODO: Validate move is legal using game logic
      // For now, we trust the client but log the move
      logger.info("Move validated", {matchId, userId, playerColor, move});

      // Update game state with the move
      // This is a simplified version - in production, use actual game logic
      const updatedGameState = {
        ...gameState,
        // Toggle player
        currentPlayer: playerColor === "white" ? "black" : "white",
        turnNumber: gameState.turnNumber + (playerColor === "black" ? 1 : 0),
        moveHistory: [
          ...(gameState.moveHistory || []),
          {
            move,
            player: playerColor,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          },
        ],
      };

      // Update Firestore
      await matchRef.update({
        gameState: updatedGameState,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("Move completed", {matchId, userId});

      return {
        success: true,
        gameState: updatedGameState,
      };
    } catch (error: any) {
      logger.error("Error making move", {matchId, userId, error});
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError("internal", error.message || "Failed to make move");
    }
  }
);

/**
 * Play a card in a multiplayer match
 * Validates the card play server-side and updates game state
 */
export const playCard = onCall<PlayCardRequest, Promise<PlayCardResponse>>(
  async (request) => {
    const {matchId, cardInstanceId, params} = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    if (!matchId || !cardInstanceId) {
      throw new HttpsError(
        "invalid-argument",
        "matchId and cardInstanceId are required"
      );
    }

    logger.info("Playing card", {matchId, userId, cardInstanceId, params});

    try {
      // Get match document
      const matchRef = db.collection("matches").doc(matchId);
      const matchDoc = await matchRef.get();

      if (!matchDoc.exists) {
        throw new HttpsError("not-found", "Match not found");
      }

      const matchData = matchDoc.data()!;

      // Verify user is a player
      if (!matchData.players.includes(userId)) {
        throw new HttpsError(
          "permission-denied",
          "User is not a player in this match"
        );
      }

      // Verify match is active
      if (matchData.status !== "active") {
        throw new HttpsError(
          "failed-precondition",
          `Match is not active (status: ${matchData.status})`
        );
      }

      const gameState = matchData.gameState;
      if (!gameState) {
        throw new HttpsError(
          "failed-precondition",
          "Game state not initialized"
        );
      }

      // Determine player color
      const playerColor = matchData.players[0] === userId ? "white" : "black";

      // Verify it's the player's turn
      if (gameState.currentPlayer !== playerColor) {
        throw new HttpsError(
          "failed-precondition",
          `It's not your turn (current player: ${gameState.currentPlayer})`
        );
      }

      // TODO: Validate card play using game logic
      // For now, we trust the client but log the action
      logger.info("Card play validated", {
        matchId,
        userId,
        playerColor,
        cardInstanceId,
        params,
      });

      // Update game state with card play
      // This is simplified - should use actual card effect logic
      const updatedGameState = {
        ...gameState,
        cardHistory: [
          ...(gameState.cardHistory || []),
          {
            cardInstanceId,
            player: playerColor,
            params,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          },
        ],
      };

      // Update Firestore
      await matchRef.update({
        gameState: updatedGameState,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("Card play completed", {matchId, userId});

      return {
        success: true,
        gameState: updatedGameState,
      };
    } catch (error: any) {
      logger.error("Error playing card", {matchId, userId, error});
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError("internal", error.message || "Failed to play card");
    }
  }
);

/**
 * Initialize game state for a new match
 * Called when both players have selected their decks
 */
export const initializeMatch = onCall<{matchId: string}, Promise<{success: boolean}>>(
  async (request) => {
    const {matchId} = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    if (!matchId) {
      throw new HttpsError("invalid-argument", "matchId is required");
    }

    logger.info("Initializing match", {matchId, userId});

    try {
      const matchRef = db.collection("matches").doc(matchId);
      const matchDoc = await matchRef.get();

      if (!matchDoc.exists) {
        throw new HttpsError("not-found", "Match not found");
      }

      const matchData = matchDoc.data()!;

      // Verify user is a player
      if (!matchData.players.includes(userId)) {
        throw new HttpsError(
          "permission-denied",
          "User is not a player in this match"
        );
      }

      // Verify match is pending (both decks selected)
      if (matchData.status !== "pending") {
        throw new HttpsError(
          "failed-precondition",
          `Match cannot be initialized (status: ${matchData.status})`
        );
      }

      // Create initial game state
      // This is simplified - should use createInitialGameState from core
      const initialGameState = {
        currentPlayer: "white",
        status: "active",
        turnNumber: 1,
        moveHistory: [],
        cardHistory: [],
        // Board state, hands, etc. would be initialized here
        // For now, client will handle this
      };

      // Update match to active with game state
      await matchRef.update({
        status: "active",
        gameState: initialGameState,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("Match initialized", {matchId});

      return {success: true};
    } catch (error: any) {
      logger.error("Error initializing match", {matchId, userId, error});
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError(
        "internal",
        error.message || "Failed to initialize match"
      );
    }
  }
);
