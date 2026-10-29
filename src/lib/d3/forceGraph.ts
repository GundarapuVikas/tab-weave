import * as d3 from 'd3';
import type { EdgeKind, EdgeRecord, NodeRecord } from '../../shared/types';
import { createNodeDrag } from './drag';
import { truncateLabel } from './labels';
import { createSimulation, type GraphLinkDatum, type GraphNodeDatum } from './simulation';
import {
  getEdgeDasharray,
  getEdgeOpacity,
  getEdgeStroke,
  getEdgeWidth,
  getNodeFill,
  getNodeRadius,
  getNodeStroke,
} from './theme';
import { createZoomBehavior } from './zoom';

interface ForceGraphOptions {
  svg: SVGSVGElement;
  width: number;
  height: number;
  nodes: NodeRecord[];
  edges: EdgeRecord[];
  onNodeClick: (nodeId: string) => void;
}

export function renderForceGraph({
  svg,
  width,
  height,
  nodes,
  edges,
  onNodeClick,
}: ForceGraphOptions): () => void {
  const root = d3.select(svg);
  root.selectAll('*').remove();

  root
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', width)
    .attr('height', height)
    .style('display', 'block');

  const defs = root.append('defs');

  const glow = defs
    .append('filter')
    .attr('id', 'tabweave-node-glow')
    .attr('x', '-50%')
    .attr('y', '-50%')
    .attr('width', '200%')
    .attr('height', '200%');

  glow.append('feGaussianBlur').attr('stdDeviation', 3).attr('result', 'blur');

  glow
    .append('feMerge')
    .selectAll('feMergeNode')
    .data(['blur', 'SourceGraphic'])
    .join('feMergeNode')
    .attr('in', (d) => d);

  const arrowKinds: EdgeKind[] = ['causal', 'heuristic', 'reference'];

  for (const kind of arrowKinds) {
    defs
      .append('marker')
      .attr('id', `tabweave-arrow-${kind}`)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 10)
      .attr('refY', 5)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .attr('markerUnits', 'userSpaceOnUse')
      .append('path')
      .attr('d', 'M0,0 L10,5 L0,10 Z')
      .attr('fill', getEdgeStroke({ kind }));
  }

  const graphLayer = root.append('g');
  const edgeLayer = graphLayer.append('g');
  const nodeLayer = graphLayer.append('g');

  const nodeData: GraphNodeDatum[] = nodes.map((node) => ({
    id: node.id,
    data: node,
  }));

  const linkData: GraphLinkDatum[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    data: edge,
  }));

  const simulation = createSimulation(nodeData, linkData, width, height);

  const zoom = createZoomBehavior((event) => {
    graphLayer.attr('transform', event.transform.toString());
  });

  // The <svg> persists across rebuilds; reset d3-zoom's internal transform so
  // it matches the freshly created (identity) graph layer.
  root.property('__zoom', d3.zoomIdentity);
  root.call(zoom);

  const linkSelection = edgeLayer
    .selectAll<SVGLineElement, GraphLinkDatum>('line')
    .data(linkData, (d) => d.id)
    .join('line')
    .attr('stroke', (d) => getEdgeStroke(d.data))
    .attr('stroke-opacity', (d) => getEdgeOpacity(d.data))
    .attr('stroke-width', (d) => getEdgeWidth(d.data))
    .attr('stroke-dasharray', (d) => getEdgeDasharray(d.data))
    .attr('stroke-linecap', 'round')
    // Parent -> child: the arrow belongs at the target end.
    .attr('marker-end', (d) => `url(#tabweave-arrow-${d.data.kind})`);

  const nodeSelection = nodeLayer
    .selectAll<SVGGElement, GraphNodeDatum>('g')
    .data(nodeData, (d) => d.id)
    .join('g')
    .attr('data-node-id', (d) => d.id)
    .attr('cursor', 'pointer')
    .call(createNodeDrag(simulation))
    .on('click', (_event, d) => {
      onNodeClick(d.id);
    });

  nodeSelection
    .append('circle')
    .attr('r', (d) => getNodeRadius(d.data))
    .attr('fill', (d) => getNodeFill(d.data))
    .attr('stroke', (d) => getNodeStroke(d.data))
    .attr('stroke-width', 1.4)
    .attr('filter', (d) => (d.data.isRoot ? 'url(#tabweave-node-glow)' : null));

  nodeSelection
    .append('text')
    .text((d) => truncateLabel(d.data.title, 24))
    .attr('x', (d) => getNodeRadius(d.data) + 10)
    .attr('y', 4)
    .attr('fill', '#e4e4e7')
    .attr('font-size', 12)
    .attr('font-family', 'Inter, system-ui, sans-serif')
    .attr('pointer-events', 'none');

  nodeSelection.append('title').text((d) => `${d.data.title}\n${d.data.url}`);

  const tick = () => {
    linkSelection.each(function (d) {
      const source = d.source as GraphNodeDatum;
      const target = d.target as GraphNodeDatum;
      const sourceX = source.x ?? 0;
      const sourceY = source.y ?? 0;
      const targetX = target.x ?? 0;
      const targetY = target.y ?? 0;
      const deltaX = targetX - sourceX;
      const deltaY = targetY - sourceY;
      const distance = Math.hypot(deltaX, deltaY) || 1;
      const inset = Math.min(getNodeRadius(target.data) + 4, distance * 0.45);

      d3.select(this)
        .attr('x1', sourceX)
        .attr('y1', sourceY)
        .attr('x2', targetX - (deltaX / distance) * inset)
        .attr('y2', targetY - (deltaY / distance) * inset);
    });

    nodeSelection.attr('transform', (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
  };

  simulation.on('tick', tick);

  // Let the layout settle briefly, then freeze it.
  const stopTimer = setTimeout(() => {
    simulation.stop();
    tick();
  }, 900);

  return () => {
    clearTimeout(stopTimer);
    simulation.stop();
    root.on('.zoom', null);
    root.selectAll('*').remove();
  };
}

/** Updates selection styling without recreating the simulation. */
export function updateGraphSelection(
  svg: SVGSVGElement,
  selectedNodeId: string | null,
): void {
  const root = d3.select(svg);
  const relatedNodeIds = new Set<string>();
  const relatedEdgeIds = new Set<string>();
  const linkSelection = root.selectAll<SVGLineElement, GraphLinkDatum>('line');

  if (selectedNodeId) {
    linkSelection.each((d) => {
      if (d.data.to === selectedNodeId) {
        relatedNodeIds.add(d.data.from);
        relatedEdgeIds.add(d.data.id);
      }

      if (d.data.from === selectedNodeId) {
        relatedNodeIds.add(d.data.to);
        relatedEdgeIds.add(d.data.id);
      }
    });
  }

  linkSelection
    .attr('stroke-opacity', (d) =>
      relatedEdgeIds.has(d.id) ? 1 : getEdgeOpacity(d.data),
    )
    .attr('stroke-width', (d) =>
      relatedEdgeIds.has(d.id)
        ? Math.max(getEdgeWidth(d.data), 2.4)
        : getEdgeWidth(d.data),
    );

  root
    .selectAll<SVGGElement, GraphNodeDatum>('g[data-node-id]')
    .select<SVGCircleElement>('circle')
    .attr('stroke-width', (d) => {
      if (d.id === selectedNodeId) {
        return 2.6;
      }

      if (relatedNodeIds.has(d.id)) {
        return 2.2;
      }

      return 1.4;
    })
    .attr('filter', (d) =>
      d.id === selectedNodeId || d.data.isRoot
        ? 'url(#tabweave-node-glow)'
        : null,
    );
}