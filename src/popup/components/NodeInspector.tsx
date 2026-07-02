import type { NodeDetailsPayload } from '../../shared/types';

interface NodeInspectorProps {
  details: NodeDetailsPayload | null;
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid grid-cols-[84px_1fr] gap-3 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="break-all text-zinc-200">{value}</span>
    </div>
  );
}

export function NodeInspector({ details }: NodeInspectorProps) {
  if (!details?.node) {
    return (
      <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/20">
        <h3 className="text-sm font-semibold text-zinc-100">Inspector</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Select a node to inspect its URL, lineage edges, and related events.
        </p>
      </aside>
    );
  }

  const { node, incomingEdges, outgoingEdges, events } = details;

  return (
    <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/20">
      <h3 className="text-sm font-semibold text-zinc-100">Inspector</h3>

      <div className="mt-4 space-y-3">
        <DetailRow label="Title" value={node.title} />
        <DetailRow label="URL" value={node.url} />
        <DetailRow label="Status" value={node.status} />
        <DetailRow label="Depth" value={node.depth} />
        <DetailRow label="Root" value={node.isRoot ? 'Yes' : 'No'} />
        <DetailRow label="Source" value={node.sourceKind} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Incoming</div>
          <div className="mt-2 text-lg font-semibold text-zinc-50">{incomingEdges.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Outgoing</div>
          <div className="mt-2 text-lg font-semibold text-zinc-50">{outgoingEdges.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Events</div>
          <div className="mt-2 text-lg font-semibold text-zinc-50">{events.length}</div>
        </div>
      </div>
    </aside>
  );
}