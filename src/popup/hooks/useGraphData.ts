import { useCallback, useEffect, useMemo, useState } from 'react';
import { MESSAGE_TYPES } from '../../shared/messages';
import type { GraphPayload, NodeDetailsPayload } from '../../shared/types';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

interface UseGraphDataResult {
  graph: GraphPayload | null;
  selectedNodeId: string | null;
  selectedNodeDetails: NodeDetailsPayload | null;
  state: LoadState;
  error: string | null;
  refresh: () => Promise<void>;
  selectNode: (nodeId: string | null) => Promise<void>;
  clearData: () => Promise<void>;
}

async function sendRuntimeMessage<TResponse>(message: unknown): Promise<TResponse> {
  const response = await chrome.runtime.sendMessage(message);
  return response as TResponse;
}

export function useGraphData(): UseGraphDataResult {
  const [graph, setGraph] = useState<GraphPayload | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<NodeDetailsPayload | null>(null);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    setState((current) => (current === 'ready' ? 'ready' : 'loading'));

    try {
      const response = await sendRuntimeMessage<
        | { ok: true; data: GraphPayload }
        | { ok: false; error: string }
      >({
        type: MESSAGE_TYPES.GET_GRAPH,
      });

      if (!response.ok) {
        throw new Error(response.error);
      }

      setGraph(response.data);

      if (selectedNodeId) {
        const stillExists = response.data.nodes.some((node) => node.id === selectedNodeId);

        if (!stillExists) {
          setSelectedNodeId(null);
          setSelectedNodeDetails(null);
        }
      }

      setState('ready');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to load graph');
    }
  }, [selectedNodeId]);

  const selectNode = useCallback(async (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    setSelectedNodeDetails(null);

    if (!nodeId) {
      return;
    }

    try {
      const response = await sendRuntimeMessage<
        | { ok: true; data: NodeDetailsPayload }
        | { ok: false; error: string }
      >({
        type: MESSAGE_TYPES.GET_NODE_DETAILS,
        nodeId,
      });

      if (!response.ok) {
        throw new Error(response.error);
      }

      setSelectedNodeDetails(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load node details');
    }
  }, []);

  const clearData = useCallback(async () => {
    try {
      const response = await sendRuntimeMessage<
        | { ok: true }
        | { ok: false; error: string }
      >({
        type: MESSAGE_TYPES.CLEAR_DATA,
      });

      if (!response.ok) {
        throw new Error(response.error);
      }

      setSelectedNodeId(null);
      setSelectedNodeDetails(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear data');
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refresh();
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [refresh]);

  return useMemo(
    () => ({
      graph,
      selectedNodeId,
      selectedNodeDetails,
      state,
      error,
      refresh,
      selectNode,
      clearData,
    }),
    [graph, selectedNodeId, selectedNodeDetails, state, error, refresh, selectNode, clearData],
  );
}