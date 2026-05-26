import type {
  CustomToolBlock,
  CustomToolManifest,
  CustomToolWorkflowConnection,
} from "../../model/customToolTypes";

type VisualConnectionLike = Partial<CustomToolWorkflowConnection>;

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
  return Array.isArray(tool.workflow.visualConnections)
    ? tool.workflow.visualConnections
    : [];
}

function sortBlockIdsByOriginalOrder(
  blockIds: string[],
  originalIndexByBlockId: Map<string, number>,
) {
  return blockIds.sort((leftBlockId, rightBlockId) => {
    return (
      (originalIndexByBlockId.get(leftBlockId) ?? Number.MAX_SAFE_INTEGER) -
      (originalIndexByBlockId.get(rightBlockId) ?? Number.MAX_SAFE_INTEGER)
    );
  });
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

  const edgeKeys = new Set<string>();
  const outgoingByBlockId = new Map<string, string[]>();
  const incomingCountByBlockId = new Map(
    originalBlocks.map((block) => [block.id, 0]),
  );

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

    if (edgeKeys.has(edgeKey)) continue;

    edgeKeys.add(edgeKey);

    const outgoing = outgoingByBlockId.get(fromBlockId) ?? [];
    outgoing.push(toBlockId);
    outgoingByBlockId.set(fromBlockId, outgoing);

    incomingCountByBlockId.set(
      toBlockId,
      (incomingCountByBlockId.get(toBlockId) ?? 0) + 1,
    );
  }

  const messages: VisualWorkflowOrderMessage[] = [];

  if (edgeKeys.size === 0) {
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

  for (const outgoing of outgoingByBlockId.values()) {
    sortBlockIdsByOriginalOrder(outgoing, originalIndexByBlockId);
  }

  const readyBlockIds = sortBlockIdsByOriginalOrder(
    originalBlocks
      .filter((block) => (incomingCountByBlockId.get(block.id) ?? 0) === 0)
      .map((block) => block.id),
    originalIndexByBlockId,
  );

  const orderedBlockIds: string[] = [];

  while (readyBlockIds.length > 0) {
    const blockId = readyBlockIds.shift();

    if (!blockId) continue;

    orderedBlockIds.push(blockId);

    for (const nextBlockId of outgoingByBlockId.get(blockId) ?? []) {
      const nextIncomingCount =
        (incomingCountByBlockId.get(nextBlockId) ?? 0) - 1;

      incomingCountByBlockId.set(nextBlockId, nextIncomingCount);

      if (nextIncomingCount === 0) {
        readyBlockIds.push(nextBlockId);
        sortBlockIdsByOriginalOrder(readyBlockIds, originalIndexByBlockId);
      }
    }
  }

  if (orderedBlockIds.length !== originalBlocks.length) {
    const blockedBlockLabels = originalBlocks
      .filter((block) => !orderedBlockIds.includes(block.id))
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
    message: `Resolved workflow execution order from ${edgeKeys.size} visual connection(s).`,
  });

  return {
    blocks: orderedBlockIds
      .map((blockId) => blockById.get(blockId))
      .filter((block): block is CustomToolBlock => Boolean(block)),
    messages,
    usedVisualConnections: true,
    succeeded: true,
  };
}