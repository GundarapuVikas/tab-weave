import type { EdgeRecord, NodeDetailsPayload, NodeRecord } from '../../shared/types';
import { logger } from '../../lib/utils/logger';

interface NodeInspectorProps {
  details: NodeDetailsPayload | null;
  nodes: NodeRecord[];
  onSelectNode: (nodeId: string) => void;
}

function isWebUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function DetailRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  return (
    <div className="grid grid-cols-[64px_1fr] gap-2 text-xs">
      <span className="text-zinc-500">{label}</span>

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in a new tab"
          onClick={(event) => {
            event.preventDefault();

            void chrome.tabs.create({ url: href }).catch((error) => {
              logger.error('Failed to open URL', error);
            });
          }}
          className="break-all text-indigo-300 underline decoration-indigo-500/40 underline-offset-2 transition hover:text-indigo-200 hover:decoration-indigo-400"
        >
          {value}
        </a>
      ) : (
        <span className="break-all text-zinc-200">{value}</span>
      )}
    </div>
  );
}

function InspectorStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-0.5 text-base font-semibold text-zinc-50">{value}</div>
    </div>
  );
}

function collectRelatedNodes(
  edges: EdgeRecord[],
  endpoint: 'from' | 'to',
  nodesById: Map<string, NodeRecord>,
): NodeRecord[] {
  const related = new Map<string, NodeRecord>();

  for (const edge of edges) {
    const node = nodesById.get(edge[endpoint]);

    if (node) {
      related.set(node.id, node);
    }
  }

  return Array.from(related.values());
}

function RelatedNodeButton({
  node,
  onSelect,
}: {
  node: NodeRecord;
  onSelect: (nodeId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-left transition hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-zinc-200">{node.title}</span>
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-500">
          {node.status}
        </span>
      </div>
      <div className="mt-0.5 truncate text-[10px] text-zinc-500">{node.url}</div>
    </button>
  );
}

function LineageSection({
  title,
  nodes,
  emptyLabel,
  onSelectNode,
}: {
  title: string;
  nodes: NodeRecord[];
  emptyLabel: string;
  onSelectNode: (nodeId: string) => void;
}) {
  return (
    <section>
      <h4 className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </h4>

      {nodes.length === 0 ? (
        <p className="mt-1.5 text-xs leading-5 text-zinc-500">{emptyLabel}</p>
      ) : (
        <div className="mt-1.5 space-y-1.5">
          {nodes.map((relatedNode) => (
            <RelatedNodeButton
              key={relatedNode.id}
              node={relatedNode}
              onSelect={onSelectNode}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function NodeInspector({ details, nodes, onSelectNode }: NodeInspectorProps) {
  if (!details?.node) {
    return (
      <aside className="max-h-[220px] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 shadow-lg shadow-black/20">
        <h3 className="text-sm font-semibold text-zinc-100">Inspector</h3>
        <p className="mt-1 text-xs leading-5 text-zinc-400">
          Select a node to inspect its URL, lineage, and related events.
        </p>
      </aside>
    );
  }

  const { node, incomingEdges, outgoingEdges, events } = details;
  const nodesById = new Map(nodes.map((relatedNode) => [relatedNode.id, relatedNode]));
  const parents = collectRelatedNodes(incomingEdges, 'from', nodesById);
  const children = collectRelatedNodes(outgoingEdges, 'to', nodesById);

  return (
    <aside className="max-h-[220px] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 shadow-lg shadow-black/20">
      <h3 className="text-sm font-semibold text-zinc-100">Inspector</h3>

      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="space-y-1.5">
            <DetailRow label="Title" value={node.title} />
            <DetailRow
              label="URL"
              value={node.url}
              href={isWebUrl(node.url) ? node.url : undefined}
            />
            <DetailRow label="Status" value={node.status} />
            <DetailRow label="Depth" value={node.depth} />
            <DetailRow label="Root" value={node.isRoot ? 'Yes' : 'No'} />
            <DetailRow label="Source" value={node.sourceKind} />
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <InspectorStat label="Incoming" value={incomingEdges.length} />
            <InspectorStat label="Outgoing" value={outgoingEdges.length} />
            <InspectorStat label="Events" value={events.length} />
          </div>
        </div>

        <div className="space-y-3">
          <LineageSection
            title="Parent"
            nodes={parents}
            emptyLabel={
              node.isRoot
                ? 'Root tab — no parent edge recorded.'
                : 'No parent relationship recorded.'
            }
            onSelectNode={onSelectNode}
          />
          <LineageSection
            title="Children"
            nodes={children}
            emptyLabel="No child tabs recorded."
            onSelectNode={onSelectNode}
          />
        </div>
      </div>
    </aside>
  );
}
