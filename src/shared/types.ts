export type TabWeaveEventType =
  | 'SESSION_START'
  | 'SESSION_END'
  | 'TAB_CREATED'
  | 'TAB_ACTIVATED'
  | 'NAVIGATION_COMMITTED'
  | 'TAB_UPDATED'
  | 'TAB_CLOSED'
  | 'EDGE_RESOLVED';

export type NodeSourceKind = 'direct' | 'navigation-derived' | 'heuristic' | 'root';

export type EdgeKind = 'causal' | 'heuristic' | 'reference';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type NodeStatus = 'open' | 'closed';

export interface BaseRecord {
  id: string;
}

export interface SessionRecord extends BaseRecord {
  startedAt: number;
  endedAt?: number;
  extensionVersion: string;
}

export interface EventRecord extends BaseRecord {
  sessionId: string;
  timestamp: number;
  type: TabWeaveEventType;
  tabId?: number;
  tabKey?: string;
  windowId?: number;
  openerTabId?: number;
  parentTabKey?: string;
  url?: string;
  title?: string;
  transitionType?: string;
  transitionQualifiers?: string[];
  payload?: Record<string, unknown>;
}

export interface NodeRecord extends BaseRecord {
  sessionId: string;
  tabId: number;
  windowId: number;
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
  url: string;
  normalizedUrl: string;
  title: string;
  favIconUrl?: string;
  rootId: string;
  depth: number;
  isRoot: boolean;
  status: NodeStatus;
  sourceKind: NodeSourceKind;
}

export interface EdgeRecord extends BaseRecord {
  sessionId: string;
  from: string;
  to: string;
  kind: EdgeKind;
  confidence: ConfidenceLevel;
  createdAt: number;
}

export interface MetaRecord extends BaseRecord {
  value: unknown;
}

export interface GraphPayload {
  session: SessionRecord | null;
  nodes: NodeRecord[];
  edges: EdgeRecord[];
}

export interface NodeDetailsPayload {
  node: NodeRecord | null;
  incomingEdges: EdgeRecord[];
  outgoingEdges: EdgeRecord[];
  events: EventRecord[];
}

export interface PendingTabCreate {
  tabId: number;
  windowId: number;
  openerTabId?: number;
  createdAt: number;
  url?: string;
  title?: string;
  favIconUrl?: string;
}

export interface RecentNavigation {
  tabId: number;
  url: string;
  transitionType?: string;
  transitionQualifiers?: string[];
  committedAt: number;
}

export interface ActiveTabSnapshot {
  tabId: number;
  windowId: number;
  activatedAt: number;
}

export interface RuntimeNodeSnapshot {
  node: NodeRecord;
  children: Set<string>;
}

export interface EdgeResolutionResult {
  parentTabKey?: string;
  kind: EdgeKind;
  confidence: ConfidenceLevel;
  sourceKind: NodeSourceKind;
  isRoot: boolean;
}

export interface CreateNodeInput {
  sessionId: string;
  tabId: number;
  windowId: number;
  url: string;
  normalizedUrl: string;
  title: string;
  favIconUrl?: string;
  rootId: string;
  depth: number;
  isRoot: boolean;
  sourceKind: NodeSourceKind;
  createdAt: number;
}

export interface UpdateNodeInput {
  id: string;
  url?: string;
  normalizedUrl?: string;
  title?: string;
  favIconUrl?: string;
  updatedAt: number;
  closedAt?: number;
  status?: NodeStatus;
}

export interface LoggerLike {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}