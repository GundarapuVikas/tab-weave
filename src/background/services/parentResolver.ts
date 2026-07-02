import { TIMING } from '../../shared/constants';
import type {
  EdgeResolutionResult,
  PendingTabCreate,
  RecentNavigation,
  SessionRecord,
} from '../../shared/types';
import { isWithinWindow } from '../../lib/utils/time';
import { runtimeCache } from './runtimeCache';

function resolveFromOpener(
  pendingCreate: PendingTabCreate,
): EdgeResolutionResult | null {
  if (pendingCreate.openerTabId === undefined) {
    return null;
  }

  const parentTabKey = runtimeCache.getTabKey(pendingCreate.openerTabId);

  if (!parentTabKey) {
    return null;
  }

  return {
    parentTabKey,
    kind: 'causal',
    confidence: 'high',
    sourceKind: 'direct',
    isRoot: false,
  };
}

function resolveFromRecentActiveTab(
  pendingCreate: PendingTabCreate,
  navigation?: RecentNavigation,
): EdgeResolutionResult | null {
  const activeTab = runtimeCache.getActiveTab(pendingCreate.windowId);

  if (!activeTab) {
    return null;
  }

  const activeTabKey = runtimeCache.getTabKey(activeTab.tabId);

  if (!activeTabKey) {
    return null;
  }

  if (activeTab.tabId === pendingCreate.tabId) {
    return null;
  }

  const createdNearActivation = isWithinWindow(
    activeTab.activatedAt,
    pendingCreate.createdAt,
    TIMING.recentActiveTabWindowMs,
  );

  if (!createdNearActivation) {
    return null;
  }

  if (navigation?.transitionType === 'link') {
    return {
      parentTabKey: activeTabKey,
      kind: 'heuristic',
      confidence: 'medium',
      sourceKind: 'navigation-derived',
      isRoot: false,
    };
  }

  return {
    parentTabKey: activeTabKey,
    kind: 'heuristic',
    confidence: 'low',
    sourceKind: 'heuristic',
    isRoot: false,
  };
}

export function resolveParentForPendingTab(
  _session: SessionRecord,
  pendingCreate: PendingTabCreate,
  navigation?: RecentNavigation,
): EdgeResolutionResult {
  const fromOpener = resolveFromOpener(pendingCreate);

  if (fromOpener) {
    return fromOpener;
  }

  const fromActiveTab = resolveFromRecentActiveTab(pendingCreate, navigation);

  if (fromActiveTab) {
    return fromActiveTab;
  }

  return {
    kind: 'causal',
    confidence: 'low',
    sourceKind: 'root',
    isRoot: true,
  };
}