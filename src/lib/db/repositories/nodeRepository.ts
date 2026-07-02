import { STORE_NAMES } from '../../../shared/constants';
import type { CreateNodeInput, NodeRecord, UpdateNodeInput } from '../../../shared/types';
import { createId } from '../../utils/id';
import { getDb } from '../indexedDb';

export async function putNode(node: NodeRecord): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAMES.nodes, node);
}

export async function createNode(input: CreateNodeInput): Promise<NodeRecord> {
  const record: NodeRecord = {
    id: createId('node'),
    sessionId: input.sessionId,
    tabId: input.tabId,
    windowId: input.windowId,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    url: input.url,
    normalizedUrl: input.normalizedUrl,
    title: input.title,
    favIconUrl: input.favIconUrl,
    rootId: input.rootId,
    depth: input.depth,
    isRoot: input.isRoot,
    status: 'open',
    sourceKind: input.sourceKind,
  };

  await putNode(record);
  return record;
}

export async function getNodeById(id: string): Promise<NodeRecord | undefined> {
  const db = await getDb();
  return db.get(STORE_NAMES.nodes, id);
}

export async function getNodesBySession(sessionId: string): Promise<NodeRecord[]> {
  const db = await getDb();
  return db.getAllFromIndex(STORE_NAMES.nodes, 'by-sessionId', sessionId);
}

export async function getOpenNodesBySession(sessionId: string): Promise<NodeRecord[]> {
  const nodes = await getNodesBySession(sessionId);
  return nodes.filter((node) => node.status === 'open');
}

export async function getNodesByTabId(tabId: number): Promise<NodeRecord[]> {
  const db = await getDb();
  return db.getAllFromIndex(STORE_NAMES.nodes, 'by-tabId', tabId);
}

export async function updateNode(input: UpdateNodeInput): Promise<NodeRecord | undefined> {
  const db = await getDb();
  const existing = await db.get(STORE_NAMES.nodes, input.id);

  if (!existing) {
    return undefined;
  }

  const updated: NodeRecord = {
    ...existing,
    url: input.url ?? existing.url,
    normalizedUrl: input.normalizedUrl ?? existing.normalizedUrl,
    title: input.title ?? existing.title,
    favIconUrl: input.favIconUrl ?? existing.favIconUrl,
    updatedAt: input.updatedAt,
    closedAt: input.closedAt ?? existing.closedAt,
    status: input.status ?? existing.status,
  };

  await db.put(STORE_NAMES.nodes, updated);
  return updated;
}

export async function clearNodes(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_NAMES.nodes);
}