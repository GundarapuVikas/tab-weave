let currentSessionId: string | null = null;

export function setCurrentSessionId(sessionId: string | null): void {
  currentSessionId = sessionId;
}

export function isCurrentSession(sessionId: string): boolean {
  return currentSessionId === sessionId;
}
