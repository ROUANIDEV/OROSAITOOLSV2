export type StableTopologicalSortEdge<TNodeId extends PropertyKey = string> = {
  from: TNodeId;
  to: TNodeId;
};

export type StableTopologicalSortOptions<TNodeId extends PropertyKey = string> = {
  nodeIds: readonly TNodeId[];
  edges: readonly StableTopologicalSortEdge<TNodeId>[];
  compareNodeIds?: (leftNodeId: TNodeId, rightNodeId: TNodeId) => number;
};

export type StableTopologicalSortResult<TNodeId extends PropertyKey = string> = {
  orderedNodeIds: TNodeId[];
  cyclicNodeIds: TNodeId[];
};

function defaultCompareNodeIds<TNodeId extends PropertyKey>(
  leftNodeId: TNodeId,
  rightNodeId: TNodeId,
) {
  return String(leftNodeId).localeCompare(String(rightNodeId));
}

function sortReadyNodeIds<TNodeId extends PropertyKey>(
  nodeIds: TNodeId[],
  compareNodeIds: (leftNodeId: TNodeId, rightNodeId: TNodeId) => number,
) {
  nodeIds.sort(compareNodeIds);
}

export function stableTopologicalSort<TNodeId extends PropertyKey>({
  nodeIds,
  edges,
  compareNodeIds = defaultCompareNodeIds,
}: StableTopologicalSortOptions<TNodeId>): StableTopologicalSortResult<TNodeId> {
  const knownNodeIds = new Set(nodeIds);
  const incomingCountByNodeId = new Map<TNodeId, number>();
  const outgoingByNodeId = new Map<TNodeId, TNodeId[]>();

  for (const nodeId of nodeIds) {
    incomingCountByNodeId.set(nodeId, 0);
    outgoingByNodeId.set(nodeId, []);
  }

  for (const edge of edges) {
    if (!knownNodeIds.has(edge.from) || !knownNodeIds.has(edge.to)) {
      continue;
    }

    incomingCountByNodeId.set(edge.to, (incomingCountByNodeId.get(edge.to) ?? 0) + 1);
    outgoingByNodeId.set(edge.from, [...(outgoingByNodeId.get(edge.from) ?? []), edge.to]);
  }

  for (const outgoingNodeIds of outgoingByNodeId.values()) {
    sortReadyNodeIds(outgoingNodeIds, compareNodeIds);
  }

  const readyNodeIds = nodeIds.filter((nodeId) => incomingCountByNodeId.get(nodeId) === 0);
  sortReadyNodeIds(readyNodeIds, compareNodeIds);

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
        sortReadyNodeIds(readyNodeIds, compareNodeIds);
      }
    }
  }

  const orderedNodeIdSet = new Set(orderedNodeIds);
  const cyclicNodeIds = nodeIds.filter((nodeId) => !orderedNodeIdSet.has(nodeId));

  return {
    orderedNodeIds,
    cyclicNodeIds,
  };
}
