export const APP_NAME = 'TabWeave';

export const DB_NAME = 'tabweave';
export const DB_VERSION = 1;

export const STORE_NAMES = {
  sessions: 'sessions',
  events: 'events',
  nodes: 'nodes',
  edges: 'edges',
  meta: 'meta',
} as const;

export const META_KEYS = {
  activeSessionId: 'activeSessionId',
} as const;

export const TIMING = {
  recentActiveTabWindowMs: 1500,
  navigationCorrelationWindowMs: 2000,
  writeQueueFlushMs: 300,
} as const;

export const GRAPH_DEFAULTS = {
  maxNodeTitleLength: 72,
  fallbackUrl: 'about:blank',
  fallbackTitle: 'Untitled Tab',
} as const;

export const EXTENSION_VERSION = '0.1.0';