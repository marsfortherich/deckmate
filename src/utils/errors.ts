/**
 * Error helpers.
 *
 * A caught value in TypeScript is `unknown`, because JavaScript allows throwing
 * anything. Typing it as `any` and reaching for `.message` is how a failure path
 * turns into a second, more confusing failure. These helpers narrow safely.
 */

/** A Firebase SDK error carries a string `code` such as "auth/wrong-password". */
export interface CodedError {
  readonly code?: string;
  readonly message?: string;
}

/**
 * Best-effort human-readable message for any caught value.
 *
 * Mirrors the `error.message || 'fallback'` idiom this codebase already used,
 * so a thrown non-Error yields the caller's message rather than
 * "[object Object]".
 */
export function getErrorMessage(error: unknown, fallback = 'Unbekannter Fehler'): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error) {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error as CodedError;
    if (typeof message === 'string' && message) {
      return message;
    }
  }
  return fallback;
}

/** The provider error code, e.g. "auth/email-already-in-use", when present. */
export function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const { code } = error as CodedError;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}
