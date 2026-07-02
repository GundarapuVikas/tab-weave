import { useEffect, useMemo, useRef } from 'react';
import type { EdgeRecord, NodeRecord } from '../../shared/types';
import { renderForceGraph } from '../../lib/d3/forceGraph';
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
    height: 520,
  });

  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => a.depth - b.depth || a.createdAt - b.createdAt);
  }, [nodes]);

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
      selectedNodeId,
      onNodeClick: onSelectNode,
    });

    return cleanup;
  }, [width, height, sortedNodes, edges, selectedNodeId, onSelectNode]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Graph View</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Force-directed lineage map with zoom, pan, and selection
          </p>
        </div>

        <div className="text-xs text-zinc-500">
          {nodes.length} nodes • {edges.length} edges
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-[520px] overflow-hidden rounded-2xl border border-zinc-800 bg-black/40"
      >
        <svg ref={svgRef} className="block h-full w-full" />
      </div>
    </section>
  );
}