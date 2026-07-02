import { EXTENSION_VERSION, META_KEYS } from '../shared/constants';
import type { SessionRecord } from '../shared/types';
import { getNodesBySession } from '../lib/db/repositories/nodeRepository';
import { getMeta, putMeta } from '../lib/db/repositories/metaRepository';
import { getSessionById, putSession, updateSessionEnd } from '../lib/db/repositories/sessionRepository';
import { createId } from '../lib/utils/id';
import { logger } from '../lib/utils/logger';
import { now } from '../lib/utils/time';
import { runtimeCache } from './services/runtimeCache';
import { logEvent } from './services/eventLogger';

let activeSession: SessionRecord | null = null;

export async function bootstrapExtension(): Promise<SessionRecord> {
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

  activeSession = session;
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

export async function getActiveSession(): Promise<SessionRecord | null> {
  if (activeSession) {
    return activeSession;
  }

  const sessionId = await getMeta<string>(META_KEYS.activeSessionId);

  if (!sessionId) {
    return null;
  }

  const session = await getSessionById(sessionId);

  if (!session) {
    return null;
  }

  activeSession = session;

  const existingNodes = await getNodesBySession(session.id);
  runtimeCache.hydrate(existingNodes);

  return session;
}

export async function ensureActiveSession(): Promise<SessionRecord> {
  const session = await getActiveSession();

  if (session) {
    return session;
  }

  return bootstrapExtension();
}

export async function shutdownActiveSession(): Promise<void> {
  const session = await getActiveSession();

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

  activeSession = null;
}