interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 px-6 text-center">
      <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">{description}</p>
    </div>
  );
}