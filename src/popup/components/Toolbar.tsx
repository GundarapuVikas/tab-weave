interface ToolbarProps {
  onRefresh: () => void | Promise<void>;
  onClear: () => void | Promise<void>;
}

export function Toolbar({ onRefresh, onClear }: ToolbarProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 shadow-lg shadow-black/20">
      <h2 className="text-sm font-semibold tracking-tight text-zinc-100">Session Overview</h2>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-700"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => void onClear()}
          className="rounded-xl border border-red-900/60 bg-red-950/40 px-2.5 py-1.5 text-xs font-medium text-red-200 transition hover:border-red-800 hover:bg-red-950/70"
        >
          Clear
        </button>
      </div>
    </div>
  );
}