import type {
  ActiveTabSnapshot,
  NodeRecord,
  PendingTabCreate,
  RecentNavigation,
  RuntimeNodeSnapshot,
} from '../../shared/types';

export class RuntimeCache {
  private activeTabByWindowId = new Map<number, ActiveTabSnapshot>();
  private tabKeyByTabId = new Map<number, string>();
  private nodeByTabKey = new Map<string, RuntimeNodeSnapshot>();
  private pendingTabCreateByTabId = new Map<number, PendingTabCreate>();
  private recentNavigationByTabId = new Map<number, RecentNavigation>();

  setActiveTab(snapshot: ActiveTabSnapshot): void {
    this.activeTabByWindowId.set(snapshot.windowId, snapshot);
  }

  getActiveTab(windowId: number): ActiveTabSnapshot | undefined {
    return this.activeTabByWindowId.get(windowId);
  }

  removeActiveTab(windowId: number): void {
    this.activeTabByWindowId.delete(windowId);
  }

  setTabKey(tabId: number, tabKey: string): void {
    this.tabKeyByTabId.set(tabId, tabKey);
  }

  getTabKey(tabId: number): string | undefined {
    return this.tabKeyByTabId.get(tabId);
  }

  deleteTabKey(tabId: number): void {
    this.tabKeyByTabId.delete(tabId);
  }

  setNode(node: NodeRecord): void {
    const existing = this.nodeByTabKey.get(node.id);

    this.nodeByTabKey.set(node.id, {
      node,
      children: existing?.children ?? new Set<string>(),
    });
  }

  getNode(tabKey: string): NodeRecord | undefined {
    return this.nodeByTabKey.get(tabKey)?.node;
  }

  getNodeSnapshot(tabKey: string): RuntimeNodeSnapshot | undefined {
    return this.nodeByTabKey.get(tabKey);
  }

  getAllNodes(): NodeRecord[] {
    return Array.from(this.nodeByTabKey.values()).map((entry) => entry.node);
  }

  addChild(parentTabKey: string, childTabKey: string): void {
    const parent = this.nodeByTabKey.get(parentTabKey);

    if (!parent) {
      return;
    }

    parent.children.add(childTabKey);
  }

  getChildren(tabKey: string): string[] {
    return Array.from(this.nodeByTabKey.get(tabKey)?.children ?? []);
  }

  setPendingTabCreate(create: PendingTabCreate): void {
    this.pendingTabCreateByTabId.set(create.tabId, create);
  }

  getPendingTabCreate(tabId: number): PendingTabCreate | undefined {
    return this.pendingTabCreateByTabId.get(tabId);
  }

  deletePendingTabCreate(tabId: number): void {
    this.pendingTabCreateByTabId.delete(tabId);
  }

  setRecentNavigation(navigation: RecentNavigation): void {
    this.recentNavigationByTabId.set(navigation.tabId, navigation);
  }

  getRecentNavigation(tabId: number): RecentNavigation | undefined {
    return this.recentNavigationByTabId.get(tabId);
  }

  deleteRecentNavigation(tabId: number): void {
    this.recentNavigationByTabId.delete(tabId);
  }

  hydrate(nodes: NodeRecord[]): void {
    this.nodeByTabKey.clear();
    this.tabKeyByTabId.clear();

    for (const node of nodes) {
      this.nodeByTabKey.set(node.id, {
        node,
        children: new Set<string>(),
      });
      this.tabKeyByTabId.set(node.tabId, node.id);
    }
  }

  clear(): void {
    this.activeTabByWindowId.clear();
    this.tabKeyByTabId.clear();
    this.nodeByTabKey.clear();
    this.pendingTabCreateByTabId.clear();
    this.recentNavigationByTabId.clear();
  }
}

export const runtimeCache = new RuntimeCache();