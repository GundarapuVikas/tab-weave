import type { EdgeRecord, NodeRecord } from '../../shared/types';

export function getNodeRadius(node: NodeRecord): number {
  if (node.isRoot) return 18;
  if (node.depth <= 1) return 13;
  return 10;
}

export function getNodeStroke(node: NodeRecord): string {
  if (node.isRoot) return '#fafafa';
  if (node.sourceKind === 'direct') return '#a1a1aa';
  if (node.sourceKind === 'navigation-derived') return '#818cf8';
  if (node.sourceKind === 'heuristic') return '#f59e0b';
  return '#52525b';
}

export function getNodeFill(node: NodeRecord): string {
  if (node.status === 'closed') return '#18181b';
  if (node.isRoot) return '#111827';
  return '#0f172a';
}

export function getEdgeStroke(edge: Pick<EdgeRecord, 'kind'>): string {
  if (edge.kind === 'causal') return '#71717a';
  if (edge.kind === 'heuristic') return '#6366f1';
  return '#52525b';
}

export function getEdgeWidth(edge: Pick<EdgeRecord, 'confidence'>): number {
  return edge.confidence === 'high' ? 1.8 : 1.3;
}

export function getEdgeDasharray(edge: EdgeRecord): string | null {
  if (edge.kind === 'heuristic') return '6 4';
  if (edge.kind === 'reference') return '2 6';
  return null;
}

export function getEdgeOpacity(edge: EdgeRecord): number {
  if (edge.confidence === 'high') return 0.95;
  if (edge.confidence === 'medium') return 0.72;
  return 0.5;
}