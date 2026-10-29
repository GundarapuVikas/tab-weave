import { EXTENSION_VERSION, META_KEYS } from '../shared/constants';
import type { SessionRecord } from '../shared/types';
import { getOpenNodesBySession } from '../lib/db/repositories/nodeRepository';
import { getMeta, putMeta } from '../lib/db/repositories/metaRepository';
import { getSessionById, putSession, updateSessionEnd } from '../lib/db/repositories/sessionRepository';
import { createId } from '../lib/utils/id';
import { logger } from '../lib/utils/logger';
import { now } from '../lib/utils/time';
import { runtimeCache } from './services/runtimeCache';
import { logEvent } from './services/eventLogger';
import { setCurrentSessionId } from './services/sessionState';

let activeSession: SessionRecord | null = null;
let sessionCreatedInThisWorker = false;
let sessionLock: Promise<unknown> = Promise.resolve();

/**
 * Serializes every session mutation. Locked functions must never call another
 * locking function, or the queue deadlocks.
 */
export function runExclusiveSessionOp<T>(fn: () => Promise<T>): Promise<T> {
  const result = sessionLock.then(fn, fn);

  sessionLock = result.then(
    () => undefined,
    () => undefined,
  );

  return result;
}

function setActiveSession(session: SessionRecord | null): void {
  activeSession = session;
  setCurrentSessionId(session?.id ?? null);
}

async function loadActiveSessionLocked(): Promise<SessionRecord | null> {
  const sessionId = await getMeta<string>(META_KEYS.activeSessionId);

  if (!sessionId) {
    return null;
  }

  const session = await getSessionById(sessionId);

  if (!session) {
    return null;
  }

  // Hydrate open nodes only: closed-node tabIds cause tab-id reuse bugs after restart.
  const openNodes = await getOpenNodesBySession(session.id);

  setActiveSession(session);
  runtimeCache.hydrate(openNodes);

  return session;
}

async function startNewSessionLocked(): Promise<SessionRecord> {
  const startedAt = now();
  const previousSessionId = await getMeta<string>(META_KEYS.activeSessionId);

  if (previousSessionId) {
    await updateSessionEnd(previousSessionId, startedAt);
  }

  const session: SessionRecord = {
    id: createId('session'),
    startedAt,
    extensionVersion: EXTENSION_VERSION,
  };

  await putSession(session);
  await putMeta(META_KEYS.activeSessionId, session.id);

  sessionCreatedInThisWorker = true;
  // Set before logging so the stale-session guard keeps SESSION_START.
  setActiveSession(session);
  runtimeCache.clear();
  runtimeCache.hydrate([]);

  await logEvent({
    sessionId: session.id,
    timestamp: startedAt,
    type: 'SESSION_START',
    payload: {
      previousSessionId,
    },
  });

  logger.info('Extension bootstrapped', {
    sessionId: session.id,
    startedAt,
  });

  return session;
}

/** Must only be called inside runExclusiveSessionOp. */
export async function ensureActiveSessionLocked(): Promise<SessionRecord> {
  if (activeSession) {
    return activeSession;
  }

  const existing = await loadActiveSessionLocked();

  if (existing) {
    return existing;
  }

  return startNewSessionLocked();
}

export function ensureActiveSession(): Promise<SessionRecord> {
  if (activeSession) {
    return Promise.resolve(activeSession);
  }

  return runExclusiveSessionOp(ensureActiveSessionLocked);
}

export function getActiveSession(): Promise<SessionRecord | null> {
  if (activeSession) {
    return Promise.resolve(activeSession);
  }

  return runExclusiveSessionOp(loadActiveSessionLocked);
}

async function bootstrapLocked(): Promise<SessionRecord> {
  // A fresh install's lazy initialization may already have created this worker's session.
  if (sessionCreatedInThisWorker && activeSession) {
    return activeSession;
  }

  return startNewSessionLocked();
}

export function bootstrapExtension(): Promise<SessionRecord> {
  return runExclusiveSessionOp(bootstrapLocked);
}

/** Must only be called inside runExclusiveSessionOp. */
export function invalidateSessionStateLocked(): void {
  setActiveSession(null);
  sessionCreatedInThisWorker = false;
  runtimeCache.clear();
}

export async function shutdownActiveSession(): Promise<void> {
  await runExclusiveSessionOp(async () => {
    const session = activeSession ?? (await loadActiveSessionLocked());

    if (!session) {
      return;
    }

    const endedAt = now();

    await updateSessionEnd(session.id, endedAt);

    await logEvent({
      sessionId: session.id,
      timestamp: endedAt,
      type: 'SESSION_END',
    });

    logger.info('Session ended', {
      sessionId: session.id,
      endedAt,
    });

    setActiveSession(null);
    runtimeCache.clear();
  });
}
