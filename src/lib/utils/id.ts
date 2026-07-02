export function createId(prefix = 'tw'): string {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}_${randomPart}`;
}

export function createTabKey(sessionId: string, tabId: number, createdAt: number): string {
  return `tab_${sessionId}_${tabId}_${createdAt}`;
}