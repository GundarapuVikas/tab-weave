export function LoadingState() {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60">
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
        <span>Loading graph data…</span>
      </div>
    </div>
  );
}