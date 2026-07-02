import type { LoggerLike } from '../../shared/types';

const PREFIX = '[TabWeave]';

function formatArgs(args: unknown[]): unknown[] {
  return [PREFIX, ...args];
}

export const logger: LoggerLike = {
  debug: (...args: unknown[]) => {
    console.debug(...formatArgs(args));
  },
  info: (...args: unknown[]) => {
    console.info(...formatArgs(args));
  },
  warn: (...args: unknown[]) => {
    console.warn(...formatArgs(args));
  },
  error: (...args: unknown[]) => {
    console.error(...formatArgs(args));
  },
};