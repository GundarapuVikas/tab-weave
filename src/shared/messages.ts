import type { GraphPayload, NodeDetailsPayload } from './types';

export const MESSAGE_TYPES = {
  PING: 'PING',
  GET_GRAPH: 'GET_GRAPH',
  GET_NODE_DETAILS: 'GET_NODE_DETAILS',
  CLEAR_DATA: 'CLEAR_DATA',
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

export interface PingMessage {
  type: typeof MESSAGE_TYPES.PING;
}

export interface GetGraphMessage {
  type: typeof MESSAGE_TYPES.GET_GRAPH;
}

export interface GetNodeDetailsMessage {
  type: typeof MESSAGE_TYPES.GET_NODE_DETAILS;
  nodeId: string;
}

export interface ClearDataMessage {
  type: typeof MESSAGE_TYPES.CLEAR_DATA;
}

export type RuntimeMessage =
  | PingMessage
  | GetGraphMessage
  | GetNodeDetailsMessage
  | ClearDataMessage;

export interface PingResponse {
  ok: true;
  app: 'TabWeave';
}

export interface GetGraphResponse {
  ok: true;
  data: GraphPayload;
}

export interface GetNodeDetailsResponse {
  ok: true;
  data: NodeDetailsPayload;
}

export interface ClearDataResponse {
  ok: true;
}

export interface ErrorResponse {
  ok: false;
  error: string;
}

export type RuntimeResponse =
  | PingResponse
  | GetGraphResponse
  | GetNodeDetailsResponse
  | ClearDataResponse
  | ErrorResponse;