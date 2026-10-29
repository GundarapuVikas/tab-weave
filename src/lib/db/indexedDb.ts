import { openDB, type IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION, STORE_NAMES } from '../../shared/constants';
import type { TabWeaveDB } from './schema';

let dbPromise: Promise<IDBPDatabase<TabWeaveDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<TabWeaveDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TabWeaveDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAMES.sessions)) {
          const sessionsStore = db.createObjectStore(STORE_NAMES.sessions, {
            keyPath: 'id',
          });

          sessionsStore.createIndex('by-startedAt', 'startedAt');
          sessionsStore.createIndex('by-endedAt', 'endedAt');
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.events)) {
          const eventsStore = db.createObjectStore(STORE_NAMES.events, {
            keyPath: 'id',
          });

          eventsStore.createIndex('by-sessionId', 'sessionId');
          eventsStore.createIndex('by-timestamp', 'timestamp');
          eventsStore.createIndex('by-tabKey', 'tabKey');
          eventsStore.createIndex('by-type', 'type');
          eventsStore.createIndex('by-session-timestamp', ['sessionId', 'timestamp']);
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.nodes)) {
          const nodesStore = db.createObjectStore(STORE_NAMES.nodes, {
            keyPath: 'id',
          });

          nodesStore.createIndex('by-sessionId', 'sessionId');
          nodesStore.createIndex('by-rootId', 'rootId');
          nodesStore.createIndex('by-updatedAt', 'updatedAt');
          nodesStore.createIndex('by-url', 'normalizedUrl');
          nodesStore.createIndex('by-tabId', 'tabId');
          nodesStore.createIndex('by-status', 'status');
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.edges)) {
          const edgesStore = db.createObjectStore(STORE_NAMES.edges, {
            keyPath: 'id',
          });

          edgesStore.createIndex('by-sessionId', 'sessionId');
          edgesStore.createIndex('by-from', 'from');
          edgesStore.createIndex('by-to', 'to');
          edgesStore.createIndex('by-createdAt', 'createdAt');
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.meta)) {
          db.createObjectStore(STORE_NAMES.meta, {
            keyPath: 'id',
          });
        }
      },
    }).catch((error: unknown) => {
      // Do not cache a failed open forever; a later attempt may succeed.
      dbPromise = null;
      throw error;
    });
  }

  return dbPromise;
}

export async function clearAllStores(): Promise<void> {
  const db = await getDb();
  const stores = [
    STORE_NAMES.sessions,
    STORE_NAMES.events,
    STORE_NAMES.nodes,
    STORE_NAMES.edges,
    STORE_NAMES.meta,
  ] as const;

  const tx = db.transaction(stores, 'readwrite');

  await Promise.all([
    tx.objectStore(STORE_NAMES.sessions).clear(),
    tx.objectStore(STORE_NAMES.events).clear(),
    tx.objectStore(STORE_NAMES.nodes).clear(),
    tx.objectStore(STORE_NAMES.edges).clear(),
    tx.objectStore(STORE_NAMES.meta).clear(),
  ]);

  await tx.done;
}

export async function deleteDatabaseConnection(): Promise<void> {
  const db = await getDb();
  db.close();
  dbPromise = null;
}