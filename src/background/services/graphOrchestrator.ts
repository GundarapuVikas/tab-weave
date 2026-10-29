/// <reference types="chrome" />

import { GRAPH_DEFAULTS } from '../../shared/constants';
import type { PendingTabCreate, RecentNavigation, SessionRecord } from '../../shared/types';
import { createEdge } from '../../lib/db/repositories/edgeRepository';
import { createNode, getNodesByTabId, updateNode } from '../../lib/db/repositories/nodeRepository';
import { wouldCreateCycle } from '../../lib/graph/cycleDetection';
import { getDisplayTitle, normalizeUrl } from '../../lib/graph/urlNormalization';
import { createTabKey } from '../../lib/utils/id';
import { logger } from '../../lib/utils/logger';
import { now } from '../../lib/utils/time';
import { ensureActiveSession } from '../bootstrap';
import { logEvent } from './eventLogger';
import { resolveParentForPendingTab } from './parentResolver';
import { runtimeCache } from './runtimeCache';
import { isCurrentSession } from './sessionState';

type TabUpdateLike = {
  status?: string;
  url?: string;
  title?: string;
  favIconUrl?: string;
};

export async function seedExistingTabs(session?: SessionRecord): Promise<void> {
  const targetSession = session ?? (await ensureActiveSession());
  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    if (!isCurrentSession(targetSession.id)) {
      logger.warn('Abandoned tab seeding because the session changed');
      return;
    }

    if (tab.id === undefined || tab.id < 0) {
      continue;
    }

    const cachedTabKey = runtimeCache.getTabKey(tab.id);
    const cachedNode = cachedTabKey ? runtimeCache.getNode(cachedTabKey) : undefined;

    if (cachedNode?.sessionId === targetSession.id && cachedNode.status === 'open') {
      continue;
    }

    const existingNodes = await getNodesByTabId(tab.id);
    const existingInSession = existingNodes.find(
      (node) => node.sessionId === targetSession.id && node.status === 'open',
    );

    if (existingInSession) {
      runtimeCache.setTabKey(tab.id, existingInSession.id);
      runtimeCache.setNode(existingInSession);
      continue;
    }

    const createdAt = now();
    const tabKey = createTabKey(targetSession.id, tab.id, createdAt);

    const node = await createNode({
      sessionId: targetSession.id,
      tabId: tab.id,
      windowId: tab.windowId,
      url: tab.url ?? GRAPH_DEFAULTS.fallbackUrl,
      normalizedUrl: normalizeUrl(tab.url),
      title: getDisplayTitle(tab.title, tab.url),
      favIconUrl: tab.favIconUrl,
      rootId: tabKey,
      depth: 0,
      isRoot: true,
      sourceKind: 'root',
      createdAt,
    });

    if (!isCurrentSession(targetSession.id)) {
      logger.warn('Abandoned tab seeding because the session changed');
      return;
    }

    runtimeCache.setTabKey(tab.id, node.id);
    runtimeCache.setNode(node);

    await logEvent({
      sessionId: targetSession.id,
      timestamp: createdAt,
      type: 'TAB_CREATED',
      tabId: tab.id,
      tabKey: node.id,
      windowId: tab.windowId,
      url: node.url,
      title: node.title,
      payload: {
        seeded: true,
      },
    });
  }

  logger.info('Existing tabs seeded');
}

export async function handlePendingTabCreated(pendingCreate: PendingTabCreate): Promise<void> {
  const session = await ensureActiveSession();
  const navigation = runtimeCache.getRecentNavigation(pendingCreate.tabId);

  const resolution = resolveParentForPendingTab(session, pendingCreate, navigation);
  const createdAt = pendingCreate.createdAt;
  const tabKey = createTabKey(session.id, pendingCreate.tabId, createdAt);

  let rootId = tabKey;
  let depth = 0;

  if (resolution.parentTabKey) {
    const parentNode = runtimeCache.getNode(resolution.parentTabKey);

    if (parentNode) {
      rootId = parentNode.rootId;
      depth = parentNode.depth + 1;
    }
  }

  const node = await createNode({
    sessionId: session.id,
    tabId: pendingCreate.tabId,
    windowId: pendingCreate.windowId,
    url: pendingCreate.url ?? GRAPH_DEFAULTS.fallbackUrl,
    normalizedUrl: normalizeUrl(pendingCreate.url),
    title: getDisplayTitle(pendingCreate.title, pendingCreate.url),
    favIconUrl: pendingCreate.favIconUrl,
    rootId,
    depth,
    isRoot: resolution.isRoot,
    sourceKind: resolution.sourceKind,
    createdAt,
  });

  runtimeCache.setTabKey(pendingCreate.tabId, node.id);
  runtimeCache.setNode(node);

  await logEvent({
    sessionId: session.id,
    timestamp: createdAt,
    type: 'TAB_CREATED',
    tabId: pendingCreate.tabId,
    tabKey: node.id,
    windowId: pendingCreate.windowId,
    openerTabId: pendingCreate.openerTabId,
    url: node.url,
    title: node.title,
    parentTabKey: resolution.parentTabKey,
  });

  if (resolution.parentTabKey) {
    const adjacency = new Map<string, Set<string>>();

    for (const cachedNode of runtimeCache.getAllNodes()) {
      adjacency.set(cachedNode.id, new Set(runtimeCache.getChildren(cachedNode.id)));
    }

    const createsCycle = wouldCreateCycle(adjacency, resolution.parentTabKey, node.id);

    if (!createsCycle) {
      await createEdge({
        sessionId: session.id,
        from: resolution.parentTabKey,
        to: node.id,
        kind: resolution.kind,
        confidence: resolution.confidence,
        createdAt,
      });

      runtimeCache.addChild(resolution.parentTabKey, node.id);

      await logEvent({
        sessionId: session.id,
        timestamp: createdAt,
        type: 'EDGE_RESOLVED',
        tabId: pendingCreate.tabId,
        tabKey: node.id,
        parentTabKey: resolution.parentTabKey,
        payload: {
          kind: resolution.kind,
          confidence: resolution.confidence,
          sourceKind: resolution.sourceKind,
        },
      });
    } else {
      logger.warn('Skipped structural edge due to cycle detection', {
        parentTabKey: resolution.parentTabKey,
        childTabKey: node.id,
      });
    }
  }

  runtimeCache.deletePendingTabCreate(pendingCreate.tabId);
}

export async function handleTabCreated(tab: chrome.tabs.Tab): Promise<void> {
  const createdAt = now();

  const pendingCreate: PendingTabCreate = {
    tabId: tab.id ?? -1,
    windowId: tab.windowId,
    openerTabId: tab.openerTabId,
    createdAt,
    url: tab.url,
    title: tab.title,
    favIconUrl: tab.favIconUrl,
  };

  if (pendingCreate.tabId < 0) {
    return;
  }

  runtimeCache.setPendingTabCreate(pendingCreate);

  await handlePendingTabCreated(pendingCreate);
}

export async function handleNavigationCommitted(details: {
  tabId: number;
  url: string;
  transitionType?: string;
  transitionQualifiers?: string[];
}): Promise<void> {
  const session = await ensureActiveSession();
  const committedAt = now();

  const navigation: RecentNavigation = {
    tabId: details.tabId,
    url: details.url,
    transitionType: details.transitionType,
    transitionQualifiers: details.transitionQualifiers,
    committedAt,
  };

  runtimeCache.setRecentNavigation(navigation);

  const tabKey = runtimeCache.getTabKey(details.tabId);

  await logEvent({
    sessionId: session.id,
    timestamp: committedAt,
    type: 'NAVIGATION_COMMITTED',
    tabId: details.tabId,
    tabKey,
    url: details.url,
    transitionType: details.transitionType,
    transitionQualifiers: details.transitionQualifiers,
  });

  if (!tabKey) {
    return;
  }

  const updatedNode = await updateNode({
    id: tabKey,
    url: details.url,
    normalizedUrl: normalizeUrl(details.url),
    updatedAt: committedAt,
  });

  if (updatedNode) {
    runtimeCache.setNode(updatedNode);
  }
}

export async function handleTabActivated(input: {
  tabId: number;
  windowId: number;
}): Promise<void> {
  const session = await ensureActiveSession();
  const activatedAt = now();

  runtimeCache.setActiveTab({
    tabId: input.tabId,
    windowId: input.windowId,
    activatedAt,
  });

  const tabKey = runtimeCache.getTabKey(input.tabId);

  await logEvent({
    sessionId: session.id,
    timestamp: activatedAt,
    type: 'TAB_ACTIVATED',
    tabId: input.tabId,
    tabKey,
    windowId: input.windowId,
  });
}

export async function handleTabUpdated(
  tabId: number,
  changeInfo: TabUpdateLike,
  tab?: chrome.tabs.Tab,
): Promise<void> {
  const session = await ensureActiveSession();
  const updatedAt = now();
  const tabKey = runtimeCache.getTabKey(tabId);

  await logEvent({
    sessionId: session.id,
    timestamp: updatedAt,
    type: 'TAB_UPDATED',
    tabId,
    tabKey,
    windowId: tab?.windowId,
    url: changeInfo.url ?? tab?.url,
    title: changeInfo.title ?? tab?.title,
    payload: {
      status: changeInfo.status,
      favIconUrl: changeInfo.favIconUrl,
    },
  });

  if (!tabKey) {
    return;
  }

  const nextUrl = changeInfo.url ?? tab?.url;
  const nextTitle = changeInfo.title ?? tab?.title;
  const nextFavicon = changeInfo.favIconUrl ?? tab?.favIconUrl;

  const updatedNode = await updateNode({
    id: tabKey,
    url: nextUrl,
    normalizedUrl: nextUrl ? normalizeUrl(nextUrl) : undefined,
    title: nextTitle ? getDisplayTitle(nextTitle, nextUrl) : undefined,
    favIconUrl: nextFavicon,
    updatedAt,
  });

  if (updatedNode) {
    runtimeCache.setNode(updatedNode);
  }
}

export async function handleTabClosed(tabId: number): Promise<void> {
  const session = await ensureActiveSession();
  const closedAt = now();
  const tabKey = runtimeCache.getTabKey(tabId);

  await logEvent({
    sessionId: session.id,
    timestamp: closedAt,
    type: 'TAB_CLOSED',
    tabId,
    tabKey,
  });

  if (!tabKey) {
    runtimeCache.deletePendingTabCreate(tabId);
    runtimeCache.deleteRecentNavigation(tabId);
    return;
  }

  const updatedNode = await updateNode({
    id: tabKey,
    updatedAt: closedAt,
    closedAt,
    status: 'closed',
  });

  if (updatedNode) {
    runtimeCache.setNode(updatedNode);
  }

  runtimeCache.deletePendingTabCreate(tabId);
  runtimeCache.deleteRecentNavigation(tabId);
}