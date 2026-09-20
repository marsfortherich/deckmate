/**
 * Application logger.
 *
 * Wraps the console so that diagnostic output is stripped outside development.
 * `debug` and `info` are silent in a production bundle; `warn` and `error`
 * always fire, because a user hitting one of those in production is exactly
 * when the output matters.
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.debug('Match state synced', { matchId });
 *
 * Never log hand contents, deck order, or anything else that constitutes
 * hidden information in a live match - the browser console is visible to the
 * player, and in an online game that is the opponent's secret too.
 */

/**
 * `import.meta.env` is injected by Vite. The optional chaining matters: these
 * modules are also imported by the standalone scripts in `scripts/`, which run
 * under tsx where no Vite env exists.
 */
const isDev: boolean = import.meta.env?.DEV ?? false;

type LogArgs = readonly unknown[];

export const logger = {
  /** Verbose diagnostic output. Development only. */
  debug: (...args: LogArgs): void => {
    if (isDev) {
      console.log(...args);
    }
  },

  /** Notable lifecycle events. Development only. */
  info: (...args: LogArgs): void => {
    if (isDev) {
      console.info(...args);
    }
  },

  /** Recoverable problems. Always emitted. */
  warn: (...args: LogArgs): void => {
    console.warn(...args);
  },

  /** Failures. Always emitted. */
  error: (...args: LogArgs): void => {
    console.error(...args);
  },
} as const;
