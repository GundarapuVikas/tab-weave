import * as d3 from 'd3';
import type { EdgeRecord, NodeRecord } from '../../shared/types';

export interface GraphNodeDatum extends d3.SimulationNodeDatum {
  id: string;
  data: NodeRecord;
}

export interface GraphLinkDatum extends d3.SimulationLinkDatum<GraphNodeDatum> {
  id: string;
  source: string | GraphNodeDatum;
  target: string | GraphNodeDatum;
  data: EdgeRecord;
}

export function createSimulation(
  nodes: GraphNodeDatum[],
  links: GraphLinkDatum[],
  width: number,
  height: number,
) {
  return d3
    .forceSimulation<GraphNodeDatum>(nodes)
    .force(
      'link',
      d3
        .forceLink<GraphNodeDatum, GraphLinkDatum>(links)
        .id((d) => d.id)
        .distance((link) => {
          if (link.data.confidence === 'high') return 110;
          if (link.data.confidence === 'medium') return 135;
          return 160;
        })
        .strength((link) => {
          if (link.data.confidence === 'high') return 0.55;
          if (link.data.confidence === 'medium') return 0.35;
          return 0.2;
        }),
    )
    .force('charge', d3.forceManyBody<GraphNodeDatum>().strength(-420))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force(
      'collision',
      d3.forceCollide<GraphNodeDatum>().radius((d) => {
        return d.data.isRoot ? 42 : 30;
      }),
    )
    .force(
      'x',
      d3
        .forceX<GraphNodeDatum>((d) => {
          const base = width * 0.22;
          const step = Math.min(d.data.depth, 6) * 95;
          return base + step;
        })
        .strength(0.12),
    )
    .force('y', d3.forceY<GraphNodeDatum>(height / 2).strength(0.06))
    .alpha(1)
    .alphaDecay(0.06);
}