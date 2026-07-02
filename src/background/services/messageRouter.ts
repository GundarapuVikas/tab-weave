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
import {
  clearEdges,
  getEdgesBySession,
  getIncomingEdges,
  getOutgoingEdges,
} from '../../lib/db/repositories/edgeRepository';
import {
  clearEvents,
  getEventsBySession,
  getEventsByTabKey,
} from '../../lib/db/repositories/eventRepository';
import { clearMeta } from '../../lib/db/repositories/metaRepository';
import { clearNodes, getNodeById, getNodesBySession } from '../../lib/db/repositories/nodeRepository';
import { clearSessions } from '../../lib/db/repositories/sessionRepository';
import { logger } from '../../lib/utils/logger';
import { ensureActiveSession } from '../bootstrap';
import { runtimeCache } from './runtimeCache';

async function handleGetGraph(): Promise<GetGraphResponse | ErrorResponse> {
  const session = await ensureActiveSession();
  const [nodes, edges] = await Promise.all([
    getNodesBySession(session.id),
    getEdgesBySession(session.id),
  ]);

  return {
    ok: true,
    data: {
      session,
      nodes,
      edges,
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
  await Promise.all([
    clearEdges(),
    clearEvents(),
    clearNodes(),
    clearMeta(),
    clearSessions(),
  ]);

  runtimeCache.clear();

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