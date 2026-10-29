import { useEffect, useMemo, useRef } from 'react';
import type { EdgeRecord, NodeRecord } from '../../shared/types';
import { renderForceGraph, updateGraphSelection } from '../../lib/d3/forceGraph';
import { useResizeObserver } from '../hooks/useResizeObserver';

interface GraphViewProps {
  nodes: NodeRecord[];
  edges: EdgeRecord[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

export function GraphView({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
}: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { width, height } = useResizeObserver(containerRef, {
    width: 700,
    height: 350,
  });

  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => a.depth - b.depth || a.createdAt - b.createdAt);
  }, [nodes]);

  const selectedNodeIdRef = useRef(selectedNodeId);

  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
  }, [selectedNodeId]);

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }

    const cleanup = renderForceGraph({
      svg: svgRef.current,
      width,
      height,
      nodes: sortedNodes,
      edges,
      onNodeClick: onSelectNode,
    });

    // Apply the current selection once, without adding it to this effect's
    // dependencies (which would rebuild the simulation on every click).
    updateGraphSelection(svgRef.current, selectedNodeIdRef.current);

    return cleanup;
  }, [width, height, sortedNodes, edges, onSelectNode]);

  useEffect(() => {
    if (svgRef.current) {
      updateGraphSelection(svgRef.current, selectedNodeId);
    }
  }, [selectedNodeId]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 shadow-lg shadow-black/20">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">Graph View</h3>

        <div className="text-xs text-zinc-500">
          {nodes.length} nodes • {edges.length} edges
        </div>
      </div>

      <div
        ref={containerRef}
        className="aspect-[2/1] w-full overflow-hidden rounded-xl border border-zinc-800 bg-black/40"
      >
        <svg ref={svgRef} className="block h-full w-full" />
      </div>
    </section>
  );
}