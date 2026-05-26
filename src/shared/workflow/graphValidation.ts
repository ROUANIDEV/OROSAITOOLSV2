import type { DirectedGraph, DirectedGraphEdge } from "./directedGraph";
import { topologicalSort } from "./topologicalSort";

export function findEdgesWithMissingNodes<TNodeId extends PropertyKey>(
  graph: DirectedGraph<TNodeId>,
): DirectedGraphEdge<TNodeId>[] {
  const nodeIds = new Set(graph.nodes);

  return graph.edges.filter((edge) => !nodeIds.has(edge.from) || !nodeIds.has(edge.to));
}

export function findDuplicateNodeIds<TNodeId extends PropertyKey>(
  nodeIds: readonly TNodeId[],
): TNodeId[] {
  const seenNodeIds = new Set<TNodeId>();
  const duplicateNodeIds = new Set<TNodeId>();

  for (const nodeId of nodeIds) {
    if (seenNodeIds.has(nodeId)) {
      duplicateNodeIds.add(nodeId);
    }

    seenNodeIds.add(nodeId);
  }

  return [...duplicateNodeIds];
}

export function findCyclicNodeIds<TNodeId extends PropertyKey>(
  graph: DirectedGraph<TNodeId>,
): TNodeId[] {
  return topologicalSort(graph).cyclicNodeIds;
}
