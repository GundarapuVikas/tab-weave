import * as d3 from 'd3';

export function createZoomBehavior(
  onZoom: (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => void,
) {
  return d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.35, 2.4])
    .on('zoom', onZoom);
}