import { STORE_NAMES } from '../../../shared/constants';
import type { EventRecord } from '../../../shared/types';
import { getDb } from '../indexedDb';

export async function putEvent(event: EventRecord): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAMES.events, event);
}

export async function putEvents(events: EventRecord[]): Promise<void> {
  if (!events.length) {
    return;
  }

  const db = await getDb();
  const tx = db.transaction(STORE_NAMES.events, 'readwrite');

  await Promise.all(events.map((event) => tx.store.put(event)));
  await tx.done;
}

export async function getEventsBySession(sessionId: string): Promise<EventRecord[]> {
  const db = await getDb();
  return db.getAllFromIndex(STORE_NAMES.events, 'by-sessionId', sessionId);
}

export async function getEventsByTabKey(tabKey: string): Promise<EventRecord[]> {
  const db = await getDb();
  return db.getAllFromIndex(STORE_NAMES.events, 'by-tabKey', tabKey);
}

export async function clearEvents(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_NAMES.events);
}