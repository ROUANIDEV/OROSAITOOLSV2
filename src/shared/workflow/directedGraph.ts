export type DirectedGraph<TNodeId extends PropertyKey = string> = {
  nodes: readonly TNodeId[];
  edges: readonly DirectedGraphEdge<TNodeId>[];
};

export type DirectedGraphEdge<TNodeId extends PropertyKey = string> = {
  from: TNodeId;
  to: TNodeId;
};

export function getOutgoingNodeIds<TNodeId extends PropertyKey>(
  graph: DirectedGraph<TNodeId>,
  nodeId: TNodeId,
): TNodeId[] {
  return graph.edges.filter((edge) => edge.from === nodeId).map((edge) => edge.to);
}

export function getIncomingNodeIds<TNodeId extends PropertyKey>(
  graph: DirectedGraph<TNodeId>,
  nodeId: TNodeId,
): TNodeId[] {
  return graph.edges.filter((edge) => edge.to === nodeId).map((edge) => edge.from);
}

export function getNodeIdSet<TNodeId extends PropertyKey>(
  graph: DirectedGraph<TNodeId>,
): Set<TNodeId> {
  return new Set(graph.nodes);
}
