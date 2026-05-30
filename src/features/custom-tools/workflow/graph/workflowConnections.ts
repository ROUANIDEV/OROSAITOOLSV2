import type {
  CustomToolBlock,
  CustomToolManifest,
  CustomToolWorkflowConnection,
} from "../../domain/customToolTypes";

export type { WorkflowConnectionStyle } from "../../domain/customToolTypes";
export type WorkflowConnection = CustomToolWorkflowConnection;
export type WorkflowWithVisualConnections = CustomToolManifest["workflow"];

function createConnectionId(fromBlockId: string, toBlockId: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `connection-${crypto.randomUUID()}`;
  }

  return `connection-${fromBlockId}-${toBlockId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function isConnectionStyle(value: unknown): value is WorkflowConnection["style"] {
  return value === "solid" || value === "dashed" || value === "curved";
}

function normalizeSourcePort(portId?: string) {
  return typeof portId === "string" && portId.trim() ? portId : "output";
}

function normalizeTargetPort(portId?: string) {
  return typeof portId === "string" && portId.trim() ? portId : "input";
}

function sameSourcePort(
  connection: WorkflowConnection,
  fromBlockId: string,
  fromPortId?: string,
) {
  return (
    connection.fromBlockId === fromBlockId &&
    normalizeSourcePort(connection.fromPortId) === normalizeSourcePort(fromPortId)
  );
}

function sameTargetPort(
  connection: WorkflowConnection,
  toBlockId: string,
  toPortId?: string,
) {
  return (
    connection.toBlockId === toBlockId &&
    normalizeTargetPort(connection.toPortId) === normalizeTargetPort(toPortId)
  );
}

function sanitizeConnection(
  value: unknown,
  blockIds: Set<string>,
): WorkflowConnection | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<WorkflowConnection>;
  if (
    typeof candidate.fromBlockId !== "string" ||
    typeof candidate.toBlockId !== "string" ||
    !blockIds.has(candidate.fromBlockId) ||
    !blockIds.has(candidate.toBlockId) ||
    candidate.fromBlockId === candidate.toBlockId
  ) {
    return null;
  }

  return {
    id:
      typeof candidate.id === "string"
        ? candidate.id
        : createConnectionId(candidate.fromBlockId, candidate.toBlockId),
    fromBlockId: candidate.fromBlockId,
    toBlockId: candidate.toBlockId,
    fromPortId:
      typeof candidate.fromPortId === "string"
        ? candidate.fromPortId
        : undefined,
    toPortId:
      typeof candidate.toPortId === "string" ? candidate.toPortId : undefined,
    style: isConnectionStyle(candidate.style) ? candidate.style : "curved",
  };
}

export function createOrderedWorkflowConnections(blocks: CustomToolBlock[]) {
  return blocks.slice(0, -1).map((block, index) => {
    const nextBlock = blocks[index + 1];
    return {
      id: `ordered-${block.id}-${nextBlock.id}`,
      fromBlockId: block.id,
      toBlockId: nextBlock.id,
      fromPortId: "output",
      toPortId: "input",
      style: "curved" as const,
    };
  });
}

export function getWorkflowConnections(draft: CustomToolManifest) {
  const blockIds = new Set(draft.workflow.blocks.map((block) => block.id));

  if (!Array.isArray(draft.workflow.visualConnections)) {
    return createOrderedWorkflowConnections(draft.workflow.blocks);
  }

  return draft.workflow.visualConnections
    .map((connection) => sanitizeConnection(connection, blockIds))
    .filter((connection): connection is WorkflowConnection => Boolean(connection));
}

export function withWorkflowConnections(
  draft: CustomToolManifest,
  connections: WorkflowConnection[],
): CustomToolManifest {
  return {
    ...draft,
    workflow: {
      ...draft.workflow,
      visualConnections: connections,
    },
  };
}

export function addWorkflowConnection(
  connections: WorkflowConnection[],
  fromBlockId: string,
  toBlockId: string,
  fromPortId?: string,
  toPortId?: string,
) {
  if (fromBlockId === toBlockId) return connections;

  const sourcePortId = normalizeSourcePort(fromPortId);
  const targetPortId = normalizeTargetPort(toPortId);

  const nextConnections = connections.filter((connection) => {
    return (
      !sameSourcePort(connection, fromBlockId, sourcePortId) &&
      !sameTargetPort(connection, toBlockId, targetPortId)
    );
  });

  return [
    ...nextConnections,
    {
      id: createConnectionId(fromBlockId, toBlockId),
      fromBlockId,
      toBlockId,
      fromPortId: sourcePortId,
      toPortId: targetPortId,
      style: "curved" as const,
    },
  ];
}

export function updateConnectionStyle(
  connections: WorkflowConnection[],
  connectionId: string,
  style: WorkflowConnection["style"],
) {
  return connections.map((connection) => {
    if (connection.id !== connectionId) return connection;
    return { ...connection, style };
  });
}

export function updateConnectionEndpoint(
  connections: WorkflowConnection[],
  connectionId: string,
  endpoint: "from" | "to",
  blockId: string,
) {
  const existing = connections.find((connection) => connection.id === connectionId);
  if (!existing) return connections;

  const nextConnection = {
    ...existing,
    fromBlockId: endpoint === "from" ? blockId : existing.fromBlockId,
    toBlockId: endpoint === "to" ? blockId : existing.toBlockId,
  };

  if (nextConnection.fromBlockId === nextConnection.toBlockId) return connections;

  return connections
    .filter((connection) => {
      if (connection.id === connectionId) return false;
      return (
        !sameSourcePort(
          connection,
          nextConnection.fromBlockId,
          nextConnection.fromPortId,
        ) &&
        !sameTargetPort(
          connection,
          nextConnection.toBlockId,
          nextConnection.toPortId,
        )
      );
    })
    .concat(nextConnection);
}
