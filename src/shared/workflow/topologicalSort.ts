import type { DirectedGraph } from "./directedGraph";

export type TopologicalSortResult<TNodeId extends PropertyKey = string> = {
  orderedNodeIds: TNodeId[];
  cyclicNodeIds: TNodeId[];
};

export function topologicalSort<TNodeId extends PropertyKey>(
  graph: DirectedGraph<TNodeId>,
): TopologicalSortResult<TNodeId> {
  const incomingCountByNodeId = new Map<TNodeId, number>();
  const outgoingByNodeId = new Map<TNodeId, TNodeId[]>();

  for (const nodeId of graph.nodes) {
    incomingCountByNodeId.set(nodeId, 0);
    outgoingByNodeId.set(nodeId, []);
  }

  for (const edge of graph.edges) {
    incomingCountByNodeId.set(edge.to, (incomingCountByNodeId.get(edge.to) ?? 0) + 1);
    outgoingByNodeId.set(edge.from, [...(outgoingByNodeId.get(edge.from) ?? []), edge.to]);
  }

  const readyNodeIds = graph.nodes.filter((nodeId) => incomingCountByNodeId.get(nodeId) === 0);
  const orderedNodeIds: TNodeId[] = [];

  while (readyNodeIds.length > 0) {
    const nodeId = readyNodeIds.shift();

    if (nodeId === undefined) {
      break;
    }

    orderedNodeIds.push(nodeId);

    for (const outgoingNodeId of outgoingByNodeId.get(nodeId) ?? []) {
      const nextIncomingCount = (incomingCountByNodeId.get(outgoingNodeId) ?? 0) - 1;
      incomingCountByNodeId.set(outgoingNodeId, nextIncomingCount);

      if (nextIncomingCount === 0) {
        readyNodeIds.push(outgoingNodeId);
      }
    }
  }

  const orderedNodeIdSet = new Set(orderedNodeIds);
  const cyclicNodeIds = graph.nodes.filter((nodeId) => !orderedNodeIdSet.has(nodeId));

  return {
    orderedNodeIds,
    cyclicNodeIds,
  };
}
