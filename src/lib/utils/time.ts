export function now(): number {
  return Date.now();
}

export function isWithinWindow(timestamp: number, reference: number, windowMs: number): boolean {
  return Math.abs(reference - timestamp) <= windowMs;
}