import * as d3 from 'd3';

export function createNodeDrag<
  NodeDatum extends d3.SimulationNodeDatum
>(simulation: d3.Simulation<NodeDatum, undefined>) {
  function dragStarted(event: d3.D3DragEvent<SVGGElement, NodeDatum, NodeDatum>, d: NodeDatum) {
    if (!event.active) {
      simulation.alphaTarget(0.2).restart();
    }

    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event: d3.D3DragEvent<SVGGElement, NodeDatum, NodeDatum>, d: NodeDatum) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragEnded(event: d3.D3DragEvent<SVGGElement, NodeDatum, NodeDatum>, d: NodeDatum) {
    if (!event.active) {
      simulation.alphaTarget(0);
    }

    d.fx = null;
    d.fy = null;
  }

  return d3.drag<SVGGElement, NodeDatum>()
    .on('start', dragStarted)
    .on('drag', dragged)
    .on('end', dragEnded);
}