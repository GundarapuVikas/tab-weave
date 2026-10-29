interface StatsBarProps {
  sessionId?: string;
  nodeCount: number;
  edgeCount: number;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 shadow-lg shadow-black/20">
      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-1 text-base font-semibold tracking-tight text-zinc-50">{value}</div>
    </div>
  );
}

export function StatsBar({ sessionId, nodeCount, edgeCount }: StatsBarProps) {
  return (
    <section className="grid grid-cols-3 gap-2">
      <StatCard label="Nodes" value={nodeCount} />
      <StatCard label="Edges" value={edgeCount} />
      <StatCard label="Session" value={sessionId ? sessionId.slice(0, 8) : '—'} />
    </section>
  );
}