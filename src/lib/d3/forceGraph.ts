import * as d3 from 'd3';
import type { EdgeRecord, NodeRecord } from '../../shared/types';
import { createNodeDrag } from './drag';
import { truncateLabel } from './labels';
import { createSimulation, type GraphLinkDatum, type GraphNodeDatum } from './simulation';
import {
  getEdgeDasharray,
  getEdgeOpacity,
  getEdgeStroke,
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
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
}

export function renderForceGraph({
  svg,
  width,
  height,
  nodes,
  edges,
  selectedNodeId,
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

  root.call(zoom);

  const linkSelection = edgeLayer
    .selectAll<SVGLineElement, GraphLinkDatum>('line')
    .data(linkData, (d) => d.id)
    .join('line')
    .attr('stroke', (d) => getEdgeStroke(d.data))
    .attr('stroke-opacity', (d) => getEdgeOpacity(d.data))
    .attr('stroke-width', (d) => (d.data.confidence === 'high' ? 1.8 : 1.3))
    .attr('stroke-dasharray', (d) => getEdgeDasharray(d.data))
    .attr('stroke-linecap', 'round');

  const nodeSelection = nodeLayer
    .selectAll<SVGGElement, GraphNodeDatum>('g')
    .data(nodeData, (d) => d.id)
    .join('g')
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
    .attr('stroke-width', (d) => (selectedNodeId === d.id ? 2.6 : 1.4))
    .attr('filter', (d) => (selectedNodeId === d.id || d.data.isRoot ? 'url(#tabweave-node-glow)' : null));

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
    linkSelection
      .attr('x1', (d) => (d.source as GraphNodeDatum).x ?? 0)
      .attr('y1', (d) => (d.source as GraphNodeDatum).y ?? 0)
      .attr('x2', (d) => (d.target as GraphNodeDatum).x ?? 0)
      .attr('y2', (d) => (d.target as GraphNodeDatum).y ?? 0);

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