import { MESSAGE_TYPES } from '../../shared/messages';
import type {
  ClearDataResponse,
  ErrorResponse,
  GetGraphResponse,
  GetNodeDetailsResponse,
  RuntimeMessage,
  RuntimeResponse,
} from '../../shared/messages';
import type { EventRecord } from '../../shared/types';
import { clearAllStores } from '../../lib/db/indexedDb';
import {
  getEdgesBySession,
  getIncomingEdges,
  getOutgoingEdges,
} from '../../lib/db/repositories/edgeRepository';
import {
  getEventsBySession,
  getEventsByTabKey,
} from '../../lib/db/repositories/eventRepository';
import { getNodeById, getNodesBySession } from '../../lib/db/repositories/nodeRepository';
import { logger } from '../../lib/utils/logger';
import {
  ensureActiveSession,
  ensureActiveSessionLocked,
  invalidateSessionStateLocked,
  runExclusiveSessionOp,
} from '../bootstrap';
import { writeQueue } from '../queues/writeQueue';
import { seedExistingTabs } from './graphOrchestrator';

async function handleGetGraph(): Promise<GetGraphResponse | ErrorResponse> {
  const session = await ensureActiveSession();
  const [nodes, edges] = await Promise.all([
    getNodesBySession(session.id),
    getEdgesBySession(session.id),
  ]);

  // A partial clear or an in-flight write must never hand d3-force a link
  // whose endpoint is missing; it throws and blanks the popup.
  const nodeIds = new Set(nodes.map((node) => node.id));
  const validEdges = edges.filter(
    (edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to),
  );

  return {
    ok: true,
    data: {
      session,
      nodes,
      edges: validEdges,
    },
  };
}

async function handleGetNodeDetails(nodeId: string): Promise<GetNodeDetailsResponse | ErrorResponse> {
  const node = await getNodeById(nodeId);

  if (!node) {
    return {
      ok: false,
      error: `Node not found: ${nodeId}`,
    };
  }

  const [incomingEdges, outgoingEdges, tabEvents, sessionEvents] = await Promise.all([
    getIncomingEdges(nodeId),
    getOutgoingEdges(nodeId),
    getEventsByTabKey(nodeId),
    getEventsBySession(node.sessionId),
  ]);

  const relatedSessionEvents: EventRecord[] = sessionEvents.filter((event: EventRecord) => {
    if (event.tabKey === nodeId) {
      return true;
    }

    return event.parentTabKey === nodeId;
  });

  const deduped = new Map<string, EventRecord>();

  for (const event of [...tabEvents, ...relatedSessionEvents]) {
    deduped.set(event.id, event);
  }

  const events = Array.from(deduped.values()).sort((a, b) => a.timestamp - b.timestamp);

  return {
    ok: true,
    data: {
      node,
      incomingEdges,
      outgoingEdges,
      events,
    },
  };
}

async function handleClearData(): Promise<ClearDataResponse> {
  await runExclusiveSessionOp(async () => {
    // Invalidate first so any handler still holding the old session cannot
    // enqueue new events while the stores are being cleared.
    invalidateSessionStateLocked();

    writeQueue.clear();
    await writeQueue.flush();

    await clearAllStores();

    // meta was cleared, so this creates exactly one fresh session.
    const session = await ensureActiveSessionLocked();

    // Represent the current browser state under the new session rather than
    // waiting for tabs to be closed and reopened.
    await seedExistingTabs(session);
  });

  return {
    ok: true,
  };
}

export function registerMessageRouter(): void {
  chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
    void (async () => {
      try {
        let response: RuntimeResponse;

        switch (message.type) {
          case MESSAGE_TYPES.PING:
            response = {
              ok: true,
              app: 'TabWeave',
            };
            break;

          case MESSAGE_TYPES.GET_GRAPH:
            response = await handleGetGraph();
            break;

          case MESSAGE_TYPES.GET_NODE_DETAILS:
            response = await handleGetNodeDetails(message.nodeId);
            break;

          case MESSAGE_TYPES.CLEAR_DATA:
            response = await handleClearData();
            break;

          default:
            response = {
              ok: false,
              error: 'Unsupported message type',
            };
            break;
        }

        sendResponse(response);
      } catch (error) {
        logger.error('Message router error', error);

        const response: ErrorResponse = {
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown runtime error',
        };

        sendResponse(response);
      }
    })();

    return true;
  });
}