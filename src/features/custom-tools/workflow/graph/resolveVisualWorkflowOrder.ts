import { stableTopologicalSort } from "@/shared/workflow";

import type {
  CustomToolBlock,
  CustomToolManifest,
  CustomToolWorkflowConnection,
} from "../../model/customToolTypes";

type VisualConnectionLike = Partial<CustomToolWorkflowConnection>;

type VisualWorkflowEdge = {
  from: string;
  to: string;
};

export type VisualWorkflowOrderMessage = {
  level: "info" | "warning" | "error";
  message: string;
};

export type VisualWorkflowOrderResult = {
  blocks: CustomToolBlock[];
  messages: VisualWorkflowOrderMessage[];
  usedVisualConnections: boolean;
  succeeded: boolean;
};

function getVisualConnections(tool: CustomToolManifest): VisualConnectionLike[] {
  return Array.isArray(tool.workflow.visualConnections) ? tool.workflow.visualConnections : [];
}

function createOriginalOrderComparator(originalIndexByBlockId: Map<string, number>) {
  return (leftBlockId: string, rightBlockId: string) => {
    return (
      (originalIndexByBlockId.get(leftBlockId) ?? Number.MAX_SAFE_INTEGER) -
      (originalIndexByBlockId.get(rightBlockId) ?? Number.MAX_SAFE_INTEGER)
    );
  };
}

function resolveVisualWorkflowEdges(
  visualConnections: VisualConnectionLike[],
  blockIds: Set<string>,
): {
  edges: VisualWorkflowEdge[];
  ignoredConnectionCount: number;
} {
  const edgeKeys = new Set<string>();
  const edges: VisualWorkflowEdge[] = [];
  let ignoredConnectionCount = 0;

  for (const connection of visualConnections) {
    const fromBlockId = connection.fromBlockId;
    const toBlockId = connection.toBlockId;

    if (
      typeof fromBlockId !== "string" ||
      typeof toBlockId !== "string" ||
      fromBlockId === toBlockId ||
      !blockIds.has(fromBlockId) ||
      !blockIds.has(toBlockId)
    ) {
      ignoredConnectionCount += 1;
      continue;
    }

    const edgeKey = `${fromBlockId}->${toBlockId}`;

    if (edgeKeys.has(edgeKey)) {
      continue;
    }

    edgeKeys.add(edgeKey);
    edges.push({
      from: fromBlockId,
      to: toBlockId,
    });
  }

  return {
    edges,
    ignoredConnectionCount,
  };
}

export function resolveVisualWorkflowOrder(
  tool: CustomToolManifest,
): VisualWorkflowOrderResult {
  const originalBlocks = tool.workflow.blocks;
  const originalIndexByBlockId = new Map(
    originalBlocks.map((block, index) => [block.id, index]),
  );
  const blockById = new Map(originalBlocks.map((block) => [block.id, block]));
  const blockIds = new Set(blockById.keys());
  const visualConnections = getVisualConnections(tool);

  if (originalBlocks.length === 0 || visualConnections.length === 0) {
    return {
      blocks: originalBlocks,
      messages: [],
      usedVisualConnections: false,
      succeeded: true,
    };
  }

  const { edges, ignoredConnectionCount } = resolveVisualWorkflowEdges(
    visualConnections,
    blockIds,
  );

  const messages: VisualWorkflowOrderMessage[] = [];

  if (edges.length === 0) {
    messages.push({
      level: "warning",
      message:
        "Visual workflow connections exist, but none connect current blocks. Using the block list order.",
    });

    return {
      blocks: originalBlocks,
      messages,
      usedVisualConnections: false,
      succeeded: true,
    };
  }

  if (ignoredConnectionCount > 0) {
    messages.push({
      level: "warning",
      message: `Ignored ${ignoredConnectionCount} stale visual connection(s) while resolving workflow order.`,
    });
  }

  const { orderedNodeIds, cyclicNodeIds } = stableTopologicalSort({
    nodeIds: originalBlocks.map((block) => block.id),
    edges,
    compareNodeIds: createOriginalOrderComparator(originalIndexByBlockId),
  });

  if (cyclicNodeIds.length > 0) {
    const cyclicNodeIdSet = new Set(cyclicNodeIds);
    const blockedBlockLabels = originalBlocks
      .filter((block) => cyclicNodeIdSet.has(block.id))
      .map((block) => block.label)
      .join(", ");

    messages.push({
      level: "error",
      message: `Visual workflow order has a cycle or blocked path near: ${blockedBlockLabels}. Remove or reroute one of the arrows before running.`,
    });

    return {
      blocks: originalBlocks,
      messages,
      usedVisualConnections: true,
      succeeded: false,
    };
  }

  messages.push({
    level: "info",
    message: `Resolved workflow execution order from ${edges.length} visual connection(s).`,
  });

  return {
    blocks: orderedNodeIds
      .map((blockId) => blockById.get(blockId))
      .filter((block): block is CustomToolBlock => Boolean(block)),
    messages,
    usedVisualConnections: true,
    succeeded: true,
  };
}
