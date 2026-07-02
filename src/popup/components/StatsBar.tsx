interface StatsBarProps {
  sessionId?: string;
  nodeCount: number;
  edgeCount: number;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 shadow-lg shadow-black/20">
      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-2 text-lg font-semibold tracking-tight text-zinc-50">{value}</div>
    </div>
  );
}

export function StatsBar({ sessionId, nodeCount, edgeCount }: StatsBarProps) {
  return (
    <section className="grid grid-cols-3 gap-3">
      <StatCard label="Nodes" value={nodeCount} />
      <StatCard label="Edges" value={edgeCount} />
      <StatCard label="Session" value={sessionId ? sessionId.slice(0, 8) : '—'} />
    </section>
  );
}