import { STORE_NAMES } from '../../../shared/constants';
import type { ConfidenceLevel, EdgeKind, EdgeRecord } from '../../../shared/types';
import { createId } from '../../utils/id';
import { getDb } from '../indexedDb';

export async function putEdge(edge: EdgeRecord): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAMES.edges, edge);
}

export async function createEdge(input: {
  sessionId: string;
  from: string;
  to: string;
  kind: EdgeKind;
  confidence: ConfidenceLevel;
  createdAt: number;
}): Promise<EdgeRecord> {
  const record: EdgeRecord = {
    id: createId('edge'),
    sessionId: input.sessionId,
    from: input.from,
    to: input.to,
    kind: input.kind,
    confidence: input.confidence,
    createdAt: input.createdAt,
  };

  await putEdge(record);
  return record;
}

export async function getEdgesBySession(sessionId: string): Promise<EdgeRecord[]> {
  const db = await getDb();
  return db.getAllFromIndex(STORE_NAMES.edges, 'by-sessionId', sessionId);
}

export async function getOutgoingEdges(nodeId: string): Promise<EdgeRecord[]> {
  const db = await getDb();
  return db.getAllFromIndex(STORE_NAMES.edges, 'by-from', nodeId);
}

export async function getIncomingEdges(nodeId: string): Promise<EdgeRecord[]> {
  const db = await getDb();
  return db.getAllFromIndex(STORE_NAMES.edges, 'by-to', nodeId);
}

export async function clearEdges(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_NAMES.edges);
}