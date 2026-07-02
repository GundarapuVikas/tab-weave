import { STORE_NAMES } from '../../../shared/constants';
import type { SessionRecord } from '../../../shared/types';
import { getDb } from '../indexedDb';

export async function putSession(session: SessionRecord): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAMES.sessions, session);
}

export async function getSessionById(id: string): Promise<SessionRecord | undefined> {
  const db = await getDb();
  return db.get(STORE_NAMES.sessions, id);
}

export async function getLatestSession(): Promise<SessionRecord | undefined> {
  const db = await getDb();
  const cursor = await db.transaction(STORE_NAMES.sessions).store.index('by-startedAt').openCursor(null, 'prev');

  return cursor?.value;
}

export async function updateSessionEnd(id: string, endedAt: number): Promise<void> {
  const db = await getDb();
  const existing = await db.get(STORE_NAMES.sessions, id);

  if (!existing) {
    return;
  }

  await db.put(STORE_NAMES.sessions, {
    ...existing,
    endedAt,
  });
}

export async function clearSessions(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_NAMES.sessions);
}