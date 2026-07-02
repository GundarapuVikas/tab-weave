import { EmptyState } from './components/EmptyState';
import { GraphView } from './components/GraphView';
import { LoadingState } from './components/LoadingState';
import { NodeInspector } from './components/NodeInspector';
import { StatsBar } from './components/StatsBar';
import { Toolbar } from './components/Toolbar';
import { useGraphData } from './hooks/useGraphData';

export default function App() {
  const {
    graph,
    selectedNodeId,
    selectedNodeDetails,
    state,
    error,
    refresh,
    selectNode,
    clearData,
  } = useGraphData();

  const nodeCount = graph?.nodes.length ?? 0;
  const edgeCount = graph?.edges.length ?? 0;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-4 text-zinc-50">
      <div className="mx-auto flex min-h-[600px] max-w-6xl flex-col gap-4">
        <header className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-5 py-4 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-50">TabWeave</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Causal browsing graph from live Chrome tab lineage
              </p>
            </div>

            <div className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              MV3 • D3 • IndexedDB
            </div>
          </div>
        </header>

        <Toolbar onRefresh={refresh} onClear={clearData} />

        <StatsBar
          sessionId={graph?.session?.id}
          nodeCount={nodeCount}
          edgeCount={edgeCount}
        />

        {state === 'loading' && <LoadingState />}

        {state === 'error' && (
          <EmptyState
            title="Could not load graph"
            description={error ?? 'Unknown popup error'}
          />
        )}

        {state === 'ready' && graph && graph.nodes.length === 0 && (
          <EmptyState
            title="No browsing graph yet"
            description="Open a few tabs, switch between them, and navigate around. Then refresh to inspect the recorded session."
          />
        )}

        {state === 'ready' && graph && graph.nodes.length > 0 && (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <GraphView
              nodes={graph.nodes}
              edges={graph.edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={(nodeId) => void selectNode(nodeId)}
            />
            <NodeInspector details={selectedNodeDetails} />
          </div>
        )}
      </div>
    </main>
  );
}