import { invoke } from "@tauri-apps/api/core";

import type { CustomToolBlock } from "../domain/customToolTypes";
import { materializeArrowDataLinks } from "../workflow/io/canvasWorkflowIo";

export const FOUNDATION_WORKFLOW_RUN_ORDER_LABEL = "arrow-linked dependency order";
export const FOUNDATION_WORKFLOW_FALLBACK_ORDER_LABEL =
  "current workflow block array order";
export const FOUNDATION_WORKFLOW_CYCLE_ORDER_LABEL =
  "arrow-linked dependency order with cycle fallback";

export const foundationWorkflowBlockTypes = [
  "io.input",
  "io.output",
  "variable.create",
  "variable.assign",
  "variable.update",
  "constant.create",
  "expression.value",
  "expression.template",
  "math.operation",
  "logic.compare",
  "scope.global",
  "scope.local",
  "function.define",
  "function.call",
  "control.if",
  "control.switch",
  "loop.for",
  "loop.forEach",
  "loop.while",
  "collection.array",
  "collection.list",
  "collection.dictionary",
  "collection.get",
  "collection.set",
  "collection.sort",
] as const;

export type FoundationWorkflowBlockType =
  (typeof foundationWorkflowBlockTypes)[number];

const foundationWorkflowBlockTypeSet = new Set<string>(
  foundationWorkflowBlockTypes,
);

type UnknownRecord = Record<string, unknown>;

export type FoundationRuntimeBlockPayload = {
  id: string;
  type: string;
  label: string;
  description?: string;
  config: UnknownRecord;
};

export type FoundationWorkflowConnectionLike = {
  id?: string;
  fromBlockId: string;
  toBlockId: string;
  fromPortId?: string;
  toPortId?: string;
  style?: string;
};

export type FoundationWorkflowRunOptions = {
  dryRun?: boolean;
  failFast?: boolean;
  maxLoopIterations?: number;
};

export type FoundationWorkflowRunPayload = {
  blocks: FoundationRuntimeBlockPayload[];
  inputs: UnknownRecord;
  options: FoundationWorkflowRunOptions;
};

export type FoundationSkippedBlock = {
  id: string;
  type: string;
  label: string;
  reason: string;
};

export type FoundationRuntimeDiagnostic = {
  severity?: string;
  blockId?: string | null;
  block_id?: string | null;
  blockType?: string | null;
  block_type?: string | null;
  field?: string | null;
  message?: string;
  help?: string | null;
};

export type FoundationRuntimeTraceItem = {
  blockId?: string;
  block_id?: string;
  blockType?: string;
  block_type?: string;
  status?: string;
  summary?: string;
  label?: string;
  notes?: string[];
};

export type FoundationRunResultSummary = {
  totalBlocks?: number;
  total_blocks?: number;
  executedBlocks?: number;
  executed_blocks?: number;
  skippedBlocks?: number;
  skipped_blocks?: number;
  errorCount?: number;
  error_count?: number;
  warningCount?: number;
  warning_count?: number;
  infoCount?: number;
  info_count?: number;
  dryRun?: boolean;
  dry_run?: boolean;
};

export type FoundationWorkflowRunResult = {
  ok?: boolean;
  executedCount?: number;
  executed_count?: number;
  plannedCount?: number;
  planned_count?: number;
  errorCount?: number;
  error_count?: number;
  warningCount?: number;
  warning_count?: number;
  diagnostics?: FoundationRuntimeDiagnostic[];
  variables?: UnknownRecord;
  constants?: UnknownRecord;
  outputs?: UnknownRecord;
  functions?: unknown[];
  trace?: FoundationRuntimeTraceItem[];
  steps?: FoundationRuntimeTraceItem[];
  summary?: FoundationRunResultSummary;
  [key: string]: unknown;
};

export type FoundationWorkflowExecutionEdge = {
  id: string;
  fromBlockId: string;
  toBlockId: string;
  fromPortId: string;
  toPortId: string;
  fromLabel: string;
  toLabel: string;
  fromType: string;
  toType: string;
  status: "active" | "ignored";
  reason?: string;
};

export type FoundationWorkflowExecutionPlan = {
  orderLabel: string;
  hasArrowOrder: boolean;
  hasCycle: boolean;
  cycleBlockIds: string[];
  orderedFoundationBlockIds: string[];
  edges: FoundationWorkflowExecutionEdge[];
  ignoredEdges: FoundationWorkflowExecutionEdge[];
};

export type FoundationWorkflowRunReport = {
  startedAt: string;
  completedAt: string;
  orderLabel: string;
  executionPlan: FoundationWorkflowExecutionPlan;
  foundationBlocks: FoundationRuntimeBlockPayload[];
  skippedBlocks: FoundationSkippedBlock[];
  payload: FoundationWorkflowRunPayload;
  result: FoundationWorkflowRunResult;
};

export type FoundationOutputTimelineItem = {
  blockId: string;
  blockType: string;
  label: string;
  rawOutput: unknown;
  primaryValue: unknown;
  primaryKey: string;
  displayValue: string;
};

export type FoundationFinalOutput = {
  blockId: string;
  blockType: string;
  label: string;
  key: string;
  value: unknown;
  displayValue: string;
} | null;

export type FoundationWorkflowOutputRole =
  | "terminal"
  | "intermediate"
  | "blockOrder"
  | "cycleFallback";

export type FoundationWorkflowOutputItem = FoundationOutputTimelineItem & {
  role: FoundationWorkflowOutputRole;
  incomingArrowCount: number;
  outgoingArrowCount: number;
  isWorkflowOutput: boolean;
  reason: string;
};

export type FoundationWorkflowOutputSummary = {
  workflowOutputs: FoundationWorkflowOutputItem[];
  intermediateOutputs: FoundationWorkflowOutputItem[];
  allOutputs: FoundationWorkflowOutputItem[];
  modeLabel: string;
  explanation: string;
};

export type FoundationArrowInputSuggestion = {
  connectionId: string;
  sourceBlockId: string;
  targetBlockId: string;
  sourceLabel: string;
  targetLabel: string;
  sourceType: string;
  targetType: string;
  sourceName: string;
  sourceOutputLabel: string;
  sourceOutputValue: unknown;
  sourceOutputDisplayValue: string;
  token: string;
  targetField: string;
  targetFieldLabel: string;
  isApplied: boolean;
  currentValue: unknown;
};

type LinkedInputConfigEntry = {
  connectionId?: string;
  sourceBlockId?: string;
  targetBlockId?: string;
  token?: string;
  targetField?: string;
  enabled?: boolean;
};

const foundationTargetFieldByType: Record<string, string[]> = {
  "io.input": ["inputId", "testValue", "defaultValue"],
  "io.output": ["expression", "value"],
  "expression.template": ["template"],
  "expression.value": ["expression", "value"],
  "variable.assign": ["value", "expression", "initialValue"],
  "variable.update": ["operand", "initialValue", "value"],
  "math.operation": ["left", "right", "resultName"],
  "logic.compare": ["left", "right", "resultName"],
  "variable.create": ["initialValue", "value"],
  "constant.create": ["value", "initialValue"],
  "function.define": ["bodyBlockIds", "returnExpression"],
  "function.call": ["arguments", "args", "input", "value"],
  "control.if": ["condition", "expression"],
  "control.switch": ["expression", "value"],
  "loop.for": ["end", "start", "step", "from", "to", "bodyBlockIds", "value"],
  "loop.forEach": ["collection", "items", "bodyBlockIds", "value"],
  "loop.while": ["condition", "expression", "bodyBlockIds"],
  "collection.array": ["items", "value"],
  "collection.list": ["items", "value"],
  "collection.dictionary": ["entries", "value"],
  "collection.get": ["key", "collection", "value"],
  "collection.set": ["value", "key", "collection"],
  "collection.sort": ["collection", "items", "value"],
};

export function isFoundationWorkflowBlock(block: CustomToolBlock) {
  return foundationWorkflowBlockTypeSet.has(String(block.type));
}

export function partitionFoundationWorkflowBlocks(blocks: CustomToolBlock[]) {
  const foundationBlocks: CustomToolBlock[] = [];
  const skippedBlocks: FoundationSkippedBlock[] = [];

  for (const block of blocks) {
    if (isFoundationWorkflowBlock(block)) {
      foundationBlocks.push(block);
      continue;
    }

    skippedBlocks.push({
      id: block.id,
      type: String(block.type),
      label: block.label || String(block.type),
      reason:
        "Skipped because this Rust foundation engine currently executes foundation model blocks only.",
    });
  }

  return { foundationBlocks, skippedBlocks };
}

function normalizeBlockConfig(config: CustomToolBlock["config"]) {
  if (config && typeof config === "object" && !Array.isArray(config)) {
    return config as UnknownRecord;
  }
  return {};
}

function toRuntimeBlockPayload(
  block: CustomToolBlock,
): FoundationRuntimeBlockPayload {
  return {
    id: block.id,
    type: String(block.type),
    label: block.label || String(block.type),
    description: block.description,
    config: normalizeBlockConfig(block.config),
  };
}

function asRecord(value: unknown): UnknownRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as UnknownRecord;
  }
  return {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getBlockLabel(block: CustomToolBlock | undefined, fallback: string) {
  return block?.label || String(block?.type ?? fallback);
}

function getBlockType(block: CustomToolBlock | undefined) {
  return String(block?.type ?? "unknown");
}

function createExecutionEdge(
  connection: FoundationWorkflowConnectionLike,
  blockById: Map<string, CustomToolBlock>,
  status: "active" | "ignored",
  reason?: string,
): FoundationWorkflowExecutionEdge {
  const fromBlock = blockById.get(connection.fromBlockId);
  const toBlock = blockById.get(connection.toBlockId);

  return {
    id:
      connection.id ??
      `connection-${connection.fromBlockId}-${connection.toBlockId}`,
    fromBlockId: connection.fromBlockId,
    toBlockId: connection.toBlockId,
    fromPortId: connection.fromPortId ?? "output",
    toPortId: connection.toPortId ?? "input",
    fromLabel: getBlockLabel(fromBlock, connection.fromBlockId),
    toLabel: getBlockLabel(toBlock, connection.toBlockId),
    fromType: getBlockType(fromBlock),
    toType: getBlockType(toBlock),
    status,
    reason,
  };
}

export function createFoundationWorkflowExecutionPlan(
  blocks: CustomToolBlock[],
  connections: FoundationWorkflowConnectionLike[] = [],
): FoundationWorkflowExecutionPlan {
  const { foundationBlocks } = partitionFoundationWorkflowBlocks(blocks);
  const foundationIds = new Set(foundationBlocks.map((block) => block.id));
  const blockById = new Map(blocks.map((block) => [block.id, block]));
  const originalIndex = new Map(
    foundationBlocks.map((block, index) => [block.id, index]),
  );
  const edges: FoundationWorkflowExecutionEdge[] = [];
  const ignoredEdges: FoundationWorkflowExecutionEdge[] = [];

  for (const connection of connections) {
    const fromBlock = blockById.get(connection.fromBlockId);
    const toBlock = blockById.get(connection.toBlockId);

    if (!fromBlock || !toBlock) {
      ignoredEdges.push(
        createExecutionEdge(
          connection,
          blockById,
          "ignored",
          "Connection references a missing block.",
        ),
      );
      continue;
    }

    if (connection.fromBlockId === connection.toBlockId) {
      ignoredEdges.push(
        createExecutionEdge(
          connection,
          blockById,
          "ignored",
          "Self-connections are visual only and cannot define execution order.",
        ),
      );
      continue;
    }

    if (!foundationIds.has(connection.fromBlockId)) {
      ignoredEdges.push(
        createExecutionEdge(
          connection,
          blockById,
          "ignored",
          "Source block is not a foundation block.",
        ),
      );
      continue;
    }

    if (!foundationIds.has(connection.toBlockId)) {
      ignoredEdges.push(
        createExecutionEdge(
          connection,
          blockById,
          "ignored",
          "Target block is not a foundation block.",
        ),
      );
      continue;
    }

    edges.push(createExecutionEdge(connection, blockById, "active"));
  }

  if (foundationBlocks.length === 0 || edges.length === 0) {
    return {
      orderLabel: FOUNDATION_WORKFLOW_FALLBACK_ORDER_LABEL,
      hasArrowOrder: false,
      hasCycle: false,
      cycleBlockIds: [],
      orderedFoundationBlockIds: foundationBlocks.map((block) => block.id),
      edges,
      ignoredEdges,
    };
  }

  const incomingCount = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const block of foundationBlocks) {
    incomingCount.set(block.id, 0);
    outgoing.set(block.id, []);
  }

  for (const edge of edges) {
    outgoing.get(edge.fromBlockId)?.push(edge.toBlockId);
    incomingCount.set(edge.toBlockId, (incomingCount.get(edge.toBlockId) ?? 0) + 1);
  }

  const sortByOriginalOrder = (left: string, right: string) => {
    return (originalIndex.get(left) ?? 0) - (originalIndex.get(right) ?? 0);
  };

  const queue = foundationBlocks
    .filter((block) => (incomingCount.get(block.id) ?? 0) === 0)
    .map((block) => block.id)
    .sort(sortByOriginalOrder);
  const orderedIds: string[] = [];

  while (queue.length > 0) {
    const blockId = queue.shift();
    if (!blockId) continue;
    orderedIds.push(blockId);

    const children = [...(outgoing.get(blockId) ?? [])].sort(sortByOriginalOrder);
    for (const childId of children) {
      const nextCount = Math.max(0, (incomingCount.get(childId) ?? 0) - 1);
      incomingCount.set(childId, nextCount);
      if (nextCount === 0) {
        queue.push(childId);
        queue.sort(sortByOriginalOrder);
      }
    }
  }

  const remainingIds = foundationBlocks
    .map((block) => block.id)
    .filter((blockId) => !orderedIds.includes(blockId));
  const hasCycle = remainingIds.length > 0;

  return {
    orderLabel: hasCycle
      ? FOUNDATION_WORKFLOW_CYCLE_ORDER_LABEL
      : FOUNDATION_WORKFLOW_RUN_ORDER_LABEL,
    hasArrowOrder: true,
    hasCycle,
    cycleBlockIds: remainingIds,
    orderedFoundationBlockIds: [...orderedIds, ...remainingIds],
    edges,
    ignoredEdges,
  };
}

export function normalizeFoundationWorkflowRunResult(
  rawValue: unknown,
): FoundationWorkflowRunResult {
  const raw = asRecord(rawValue);
  const summary = asRecord(raw.summary);

  return {
    ...raw,
    ok: raw.ok === true,
    executedCount: asNumber(
      raw.executedCount,
      asNumber(raw.executed_count, asNumber(summary.executedBlocks, asNumber(summary.executed_blocks))),
    ),
    executed_count: asNumber(
      raw.executed_count,
      asNumber(raw.executedCount, asNumber(summary.executed_blocks, asNumber(summary.executedBlocks))),
    ),
    plannedCount: asNumber(
      raw.plannedCount,
      asNumber(raw.planned_count, asNumber(summary.skippedBlocks, asNumber(summary.skipped_blocks))),
    ),
    planned_count: asNumber(
      raw.planned_count,
      asNumber(raw.plannedCount, asNumber(summary.skipped_blocks, asNumber(summary.skippedBlocks))),
    ),
    errorCount: asNumber(
      raw.errorCount,
      asNumber(raw.error_count, asNumber(summary.errorCount, asNumber(summary.error_count))),
    ),
    error_count: asNumber(
      raw.error_count,
      asNumber(raw.errorCount, asNumber(summary.error_count, asNumber(summary.errorCount))),
    ),
    warningCount: asNumber(
      raw.warningCount,
      asNumber(raw.warning_count, asNumber(summary.warningCount, asNumber(summary.warning_count))),
    ),
    warning_count: asNumber(
      raw.warning_count,
      asNumber(raw.warningCount, asNumber(summary.warning_count, asNumber(summary.warningCount))),
    ),
    diagnostics: asArray<FoundationRuntimeDiagnostic>(raw.diagnostics),
    variables: asRecord(raw.variables),
    constants: asRecord(raw.constants),
    outputs: asRecord(raw.outputs),
    functions: asArray(raw.functions),
    trace: asArray<FoundationRuntimeTraceItem>(raw.trace),
    steps: asArray<FoundationRuntimeTraceItem>(raw.steps),
    summary: summary as FoundationRunResultSummary,
  };
}


function getBodyFieldForConnection(
  sourceBlock: CustomToolBlock,
  connection: FoundationWorkflowConnectionLike,
) {
  const sourceType = String(sourceBlock.type);
  const fromPortId = connection.fromPortId ?? "output";

  if (
    (sourceType === "loop.for" ||
      sourceType === "loop.forEach" ||
      sourceType === "loop.while") &&
    (fromPortId === "iteration" || fromPortId === "body")
  ) {
    return "bodyBlockIds";
  }

  if (sourceType === "function.define" && fromPortId === "body") {
    return "bodyBlockIds";
  }

  if (sourceType === "control.if" && fromPortId === "true") {
    return "trueBodyBlockIds";
  }

  if (sourceType === "control.if" && fromPortId === "false") {
    return "falseBodyBlockIds";
  }

  if (sourceType === "control.switch" && fromPortId === "default") {
    return "defaultBodyBlockIds";
  }

  return null;
}

function isBodyControlPort(portId: string | undefined) {
  return (
    portId === "iteration" ||
    portId === "body" ||
    portId === "true" ||
    portId === "false" ||
    portId === "matched" ||
    portId === "default"
  );
}

function collectBodyChain(
  startBlockId: string,
  blockById: Map<string, CustomToolBlock>,
  connections: FoundationWorkflowConnectionLike[],
  containerBlockId: string,
) {
  const result: string[] = [];
  const visited = new Set<string>();
  let currentBlockId: string | undefined = startBlockId;

  while (currentBlockId && !visited.has(currentBlockId)) {
    if (currentBlockId === containerBlockId) break;
    const currentBlock = blockById.get(currentBlockId);
    if (!currentBlock || !isFoundationWorkflowBlock(currentBlock)) break;

    visited.add(currentBlockId);
    result.push(currentBlockId);

    const nextConnection:any = connections.find((connection) => {
      return (
        connection.fromBlockId === currentBlockId &&
        connection.toBlockId !== containerBlockId &&
        !isBodyControlPort(connection.fromPortId) &&
        (connection.fromPortId === "next" || connection.toPortId === "run") &&
        Boolean(blockById.get(connection.toBlockId))
      );
    });

    currentBlockId = nextConnection?.toBlockId;
  }

  return result;
}

function mergeBodyIds(currentValue: unknown, newIds: string[]) {
  const currentIds = Array.isArray(currentValue)
    ? currentValue.filter((value): value is string => typeof value === "string")
    : [];
  return [...new Set([...currentIds, ...newIds])];
}

function applyBodyLinksToBlocks(
  blocks: CustomToolBlock[],
  connections: FoundationWorkflowConnectionLike[],
) {
  if (connections.length === 0) return blocks;

  const blockById = new Map(blocks.map((block) => [block.id, block]));
  const configByBlockId = new Map<string, UnknownRecord>();
  const bodyOnlyBlockIds = new Set<string>();

  for (const connection of connections) {
    const sourceBlock = blockById.get(connection.fromBlockId);
    const targetBlock = blockById.get(connection.toBlockId);
    if (!sourceBlock || !targetBlock) continue;
    if (!isFoundationWorkflowBlock(sourceBlock) || !isFoundationWorkflowBlock(targetBlock)) {
      continue;
    }

    const bodyField = getBodyFieldForConnection(sourceBlock, connection);
    if (!bodyField) continue;

    const targetIds = collectBodyChain(
      connection.toBlockId,
      blockById,
      connections,
      sourceBlock.id,
    );
    if (targetIds.length === 0) continue;

    targetIds.forEach((targetId) => bodyOnlyBlockIds.add(targetId));

    const currentConfig =
      configByBlockId.get(sourceBlock.id) ?? normalizeBlockConfig(sourceBlock.config);
    configByBlockId.set(sourceBlock.id, {
      ...currentConfig,
      [bodyField]: mergeBodyIds(currentConfig[bodyField], targetIds),
    });
  }

  if (configByBlockId.size === 0 && bodyOnlyBlockIds.size === 0) return blocks;

  return blocks.map((block) => {
    const nextConfig = configByBlockId.get(block.id) ?? normalizeBlockConfig(block.config);
    if (bodyOnlyBlockIds.has(block.id)) {
      return {
        ...block,
        config: {
          ...nextConfig,
          __workflowRole: "body",
          __skipTopLevel: true,
        },
      };
    }
    return configByBlockId.has(block.id) ? { ...block, config: nextConfig } : block;
  });
}

export function createFoundationWorkflowRunPayload(
  blocks: CustomToolBlock[],
  options: FoundationWorkflowRunOptions = {},
  connections: FoundationWorkflowConnectionLike[] = [],
  inputs: UnknownRecord = {},
): {
  payload: FoundationWorkflowRunPayload;
  foundationBlocks: FoundationRuntimeBlockPayload[];
  skippedBlocks: FoundationSkippedBlock[];
  executionPlan: FoundationWorkflowExecutionPlan;
} {
  const partitioned = partitionFoundationWorkflowBlocks(blocks);
  const blockById = new Map(blocks.map((block) => [block.id, block]));
  const executionPlan = createFoundationWorkflowExecutionPlan(blocks, connections);
  const orderedBlocks = executionPlan.orderedFoundationBlockIds
    .map((blockId) => blockById.get(blockId))
    .filter((block): block is CustomToolBlock => Boolean(block));
  const blocksWithDataLinks = materializeArrowDataLinks(orderedBlocks, connections);
  const blocksWithBodyLinks = applyBodyLinksToBlocks(blocksWithDataLinks, connections);
  const foundationBlocks = blocksWithBodyLinks.map(toRuntimeBlockPayload);

  return {
    foundationBlocks,
    skippedBlocks: partitioned.skippedBlocks,
    executionPlan,
    payload: {
      blocks: foundationBlocks,
      inputs: asRecord(inputs),
      options: {
        dryRun: options.dryRun ?? false,
        failFast: options.failFast ?? false,
        maxLoopIterations: options.maxLoopIterations ?? 1_000,
      },
    },
  };
}

export async function runFoundationWorkflowFromBlocks(
  blocks: CustomToolBlock[],
  options: FoundationWorkflowRunOptions = {},
  connections: FoundationWorkflowConnectionLike[] = [],
  inputs: UnknownRecord = {},
): Promise<FoundationWorkflowRunReport> {
  const startedAt = new Date().toISOString();
  const { payload, foundationBlocks, skippedBlocks, executionPlan } =
    createFoundationWorkflowRunPayload(blocks, options, connections, inputs);
  const rawResult = await invoke("custom_tool_foundation_run", {
    payload,
  });

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    orderLabel: executionPlan.orderLabel,
    executionPlan,
    foundationBlocks,
    skippedBlocks,
    payload,
    result: normalizeFoundationWorkflowRunResult(rawResult),
  };
}

export function toFoundationRunErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown Rust foundation workflow execution error.";
  }
}

function getBlockMeta(report: FoundationWorkflowRunReport, blockId: string) {
  return report.foundationBlocks.find((block) => block.id === blockId);
}

function outputPrimaryValue(rawOutput: unknown): { key: string; value: unknown } {
  if (!rawOutput || typeof rawOutput !== "object" || Array.isArray(rawOutput)) {
    return { key: "value", value: rawOutput };
  }

  const output = rawOutput as UnknownRecord;
  const preferredKeys = [
    "text",
    "result",
    "output",
    "value",
    "input",
    "assignedValue",
    "constant",
    "sorted",
    "array",
    "list",
    "dictionary",
    "collection",
    "function",
    "scope",
    "iterations",
    "condition",
  ];

  for (const key of preferredKeys) {
    if (Object.prototype.hasOwnProperty.call(output, key)) {
      return { key, value: output[key] };
    }
  }

  const firstEntry = Object.entries(output)[0];
  if (firstEntry) return { key: firstEntry[0], value: firstEntry[1] };
  return { key: "value", value: rawOutput };
}

export function formatFoundationOutputValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "null";
  if (typeof value === "undefined") return "undefined";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function createFoundationOutputTimeline(
  report: FoundationWorkflowRunReport,
): FoundationOutputTimelineItem[] {
  const outputs = asRecord(report.result.outputs);
  const orderedBlockIds = report.foundationBlocks.map((block) => block.id);
  const allOutputIds = Object.keys(outputs);
  const outputIds = [
    ...orderedBlockIds.filter((id) => Object.prototype.hasOwnProperty.call(outputs, id)),
    ...allOutputIds.filter((id) => !orderedBlockIds.includes(id)),
  ];

  return outputIds.map((blockId) => {
    const block = getBlockMeta(report, blockId);
    const rawOutput = outputs[blockId];
    const primary = outputPrimaryValue(rawOutput);

    return {
      blockId,
      blockType: block?.type ?? "unknown",
      label: block?.label ?? blockId,
      rawOutput,
      primaryValue: primary.value,
      primaryKey: primary.key,
      displayValue: formatFoundationOutputValue(primary.value),
    };
  });
}

export function getFoundationFinalOutput(
  report: FoundationWorkflowRunReport,
): FoundationFinalOutput {
  const timeline = createFoundationOutputTimeline(report);
  for (const item of [...timeline].reverse()) {
    if (typeof item.primaryValue === "undefined") continue;
    return {
      blockId: item.blockId,
      blockType: item.blockType,
      label: item.label,
      key: item.primaryKey,
      value: item.primaryValue,
      displayValue: item.displayValue,
    };
  }
  return null;
}

function countWorkflowEdgesByBlockId(edges: FoundationWorkflowExecutionEdge[]) {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();

  for (const edge of edges) {
    outgoing.set(edge.fromBlockId, (outgoing.get(edge.fromBlockId) ?? 0) + 1);
    incoming.set(edge.toBlockId, (incoming.get(edge.toBlockId) ?? 0) + 1);
  }

  return { incoming, outgoing };
}

function isUserOutputBlock(report: FoundationWorkflowRunReport, blockId: string) {
  return report.foundationBlocks.some((block) => {
    return block.id === blockId && block.type === "io.output";
  });
}

export function createFoundationWorkflowOutputSummary(
  report: FoundationWorkflowRunReport,
): FoundationWorkflowOutputSummary {
  const timeline = createFoundationOutputTimeline(report);
  const activeEdges = report.executionPlan.edges;
  const hasArrowGraph = activeEdges.length > 0;
  const { incoming, outgoing } = countWorkflowEdgesByBlockId(activeEdges);
  const hasExplicitUserOutput = report.foundationBlocks.some(
    (block) => block.type === "io.output",
  );

  const allOutputs: FoundationWorkflowOutputItem[] = timeline.map((item) => {
    const incomingArrowCount = incoming.get(item.blockId) ?? 0;
    const outgoingArrowCount = outgoing.get(item.blockId) ?? 0;
    const userOutput = isUserOutputBlock(report, item.blockId);

    if (userOutput) {
      return {
        ...item,
        incomingArrowCount,
        outgoingArrowCount,
        role: "terminal",
        isWorkflowOutput: true,
        reason: "This is an Output block, so it is shown as the user-facing workflow result.",
      };
    }

    if (hasExplicitUserOutput) {
      return {
        ...item,
        incomingArrowCount,
        outgoingArrowCount,
        role: "intermediate",
        isWorkflowOutput: false,
        reason: "An Output block exists, so this value is treated as intermediate data.",
      };
    }

    if (!hasArrowGraph) {
      return {
        ...item,
        incomingArrowCount,
        outgoingArrowCount,
        role: "blockOrder",
        isWorkflowOutput: true,
        reason: "No arrows and no Output block were found, so this emitted value is shown.",
      };
    }

    if (report.executionPlan.hasCycle) {
      return {
        ...item,
        incomingArrowCount,
        outgoingArrowCount,
        role: outgoingArrowCount === 0 ? "terminal" : "cycleFallback",
        isWorkflowOutput: outgoingArrowCount === 0,
        reason:
          outgoingArrowCount === 0
            ? "This block has no outgoing arrow, so it is shown as a fallback output."
            : "A cycle exists in the arrow graph. This value is intermediate/cycle data.",
      };
    }

    return {
      ...item,
      incomingArrowCount,
      outgoingArrowCount,
      role: outgoingArrowCount === 0 ? "terminal" : "intermediate",
      isWorkflowOutput: outgoingArrowCount === 0,
      reason:
        outgoingArrowCount === 0
          ? "This block has no outgoing arrow, so it is shown as a fallback output."
          : "This output feeds another block through an arrow, so it is intermediate data.",
    };
  });

  const workflowOutputs = allOutputs.filter((item) => item.isWorkflowOutput);
  const intermediateOutputs = allOutputs.filter((item) => !item.isWorkflowOutput);

  if (workflowOutputs.length === 0 && allOutputs.length > 0) {
    return {
      workflowOutputs: allOutputs,
      intermediateOutputs: [],
      allOutputs,
      modeLabel: "all emitted outputs",
      explanation:
        "No Output block produced a value, so every emitted block value is shown for debugging.",
    };
  }

  if (hasExplicitUserOutput) {
    return {
      workflowOutputs,
      intermediateOutputs,
      allOutputs,
      modeLabel: "user output blocks",
      explanation: "Only Output blocks are shown as final user results. Other block values remain intermediate.",
    };
  }

  if (!hasArrowGraph) {
    return {
      workflowOutputs,
      intermediateOutputs,
      allOutputs,
      modeLabel: "block-order outputs",
      explanation: "No arrows are connected, so every emitted value is shown.",
    };
  }

  return {
    workflowOutputs,
    intermediateOutputs,
    allOutputs,
    modeLabel: "terminal arrow outputs",
    explanation:
      "No Output block exists, so terminal blocks in the arrow graph are shown as fallback results.",
  };
}

function normalizeLinkedName(value: string) {
  const normalized = value
    .trim()
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!normalized) return "value";
  if (/^[0-9]/.test(normalized)) return `value_${normalized}`;
  return normalized;
}

function getConfigString(config: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = config[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function getFoundationArrowSourceName(block: CustomToolBlock) {
  const config = normalizeBlockConfig(block.config);
  const explicitName = getConfigString(config, [
    "inputId",
    "outputId",
    "assignTo",
    "name",
    "variableName",
    "constantName",
    "functionName",
    "resultName",
    "outputName",
    "reference",
    "key",
  ]);

  if (explicitName) return normalizeLinkedName(explicitName);
  if (block.label && block.label.trim()) return normalizeLinkedName(block.label);
  return normalizeLinkedName(String(block.type));
}

function getFoundationArrowInputToken(sourceBlock: CustomToolBlock) {
  return getFoundationArrowSourceName(sourceBlock);
}

function getFirstConfigValue(
  config: UnknownRecord,
  keys: string[],
): { key: string; value: unknown } | null {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      return { key, value: config[key] };
    }
  }
  return null;
}

function getTargetFieldLabel(field: string) {
  return field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (match) => match.toUpperCase());
}

function getFoundationSourceOutput(block: CustomToolBlock): {
  label: string;
  value: unknown;
} {
  const config = normalizeBlockConfig(block.config);
  const blockType = String(block.type);

  if (blockType === "io.input") {
    const output = getFirstConfigValue(config, ["testValue", "defaultValue", "inputId"]);
    return { label: "Canvas input", value: output?.value };
  }

  if (blockType === "io.output") {
    const output = getFirstConfigValue(config, ["expression", "value", "outputId"]);
    return { label: "Canvas output", value: output?.value };
  }

  if (blockType === "variable.create" || blockType === "variable.assign") {
    const output = getFirstConfigValue(config, ["initialValue", "value", "expression"]);
    return { label: "Variable value", value: output?.value };
  }

  if (blockType === "constant.create") {
    const output = getFirstConfigValue(config, ["value", "initialValue"]);
    return { label: "Constant value", value: output?.value };
  }

  if (blockType === "expression.template") {
    const output = getFirstConfigValue(config, ["template", "text", "value"]);
    return { label: "Template text", value: output?.value };
  }

  if (blockType === "expression.value") {
    const output = getFirstConfigValue(config, ["expression", "value"]);
    return { label: "Expression value", value: output?.value };
  }

  if (blockType === "math.operation") {
    const output = getFirstConfigValue(config, ["resultName", "left", "right"]);
    return { label: "Math result", value: output?.value };
  }

  if (blockType === "logic.compare") {
    const output = getFirstConfigValue(config, ["resultName", "left", "right"]);
    return { label: "Comparison result", value: output?.value };
  }

  if (blockType === "collection.array" || blockType === "collection.list") {
    const output = getFirstConfigValue(config, ["items", "value"]);
    return {
      label: blockType === "collection.array" ? "Array items" : "List items",
      value: output?.value,
    };
  }

  if (blockType === "collection.sort") {
    const output = getFirstConfigValue(config, ["collection", "items", "value"]);
    return { label: "Sorted collection input", value: output?.value };
  }

  if (blockType === "collection.dictionary") {
    const output = getFirstConfigValue(config, ["entries", "value"]);
    return { label: "Dictionary entries", value: output?.value };
  }

  const fallback = getFirstConfigValue(config, [
    "output",
    "result",
    "value",
    "expression",
    "template",
    "name",
  ]);
  return {
    label: fallback?.key ? getTargetFieldLabel(fallback.key) : "Output",
    value: fallback?.value,
  };
}

function getTargetField(block: CustomToolBlock) {
  const config = normalizeBlockConfig(block.config);
  const preferredFields = foundationTargetFieldByType[String(block.type)] ?? [];

  for (const field of preferredFields) {
    if (Object.prototype.hasOwnProperty.call(config, field)) return field;
  }

  for (const field of [
    "template",
    "expression",
    "value",
    "initialValue",
    "input",
    "text",
    "condition",
    "collection",
  ]) {
    if (Object.prototype.hasOwnProperty.call(config, field)) return field;
  }

  return preferredFields[0] ?? "linkedInput";
}


function getTargetFieldForConnection(
  block: CustomToolBlock,
  connection: FoundationWorkflowConnectionLike,
) {
  const toPortId = connection.toPortId;
  if (!toPortId || toPortId === "run" || toPortId === "next") return "";
  const preferredFields = foundationTargetFieldByType[String(block.type)] ?? [];
  if (toPortId && preferredFields.includes(toPortId)) return toPortId;
  if (
    toPortId &&
    [
      "start",
      "end",
      "step",
      "condition",
      "expression",
      "value",
      "initialValue",
      "collection",
      "key",
      "arguments",
      "args",
      "left",
      "right",
    ].includes(toPortId)
  ) {
    return toPortId;
  }
  return getTargetField(block);
}

function getConnectionKey(connection: FoundationWorkflowConnectionLike) {
  return (
    connection.id ??
    `${connection.fromBlockId}:${connection.fromPortId ?? "output"}->${
      connection.toBlockId
    }:${connection.toPortId ?? "input"}`
  );
}

function getLinkedInputs(config: UnknownRecord) {
  return Array.isArray(config.linkedInputs)
    ? (config.linkedInputs as LinkedInputConfigEntry[])
    : [];
}

function isTokenApplied(
  config: UnknownRecord,
  field: string,
  token: string,
  connectionId: string,
) {
  const value = config[field];
  if (typeof value === "string" && value.includes(token)) return true;

  return getLinkedInputs(config).some((entry) => {
    return (
      entry.enabled !== false &&
      entry.connectionId === connectionId &&
      entry.token === token
    );
  });
}

export function createFoundationArrowInputSuggestions(
  blocks: CustomToolBlock[],
  connections: FoundationWorkflowConnectionLike[] = [],
): FoundationArrowInputSuggestion[] {
  const blockById = new Map(blocks.map((block) => [block.id, block]));

  return connections.flatMap((connection) => {
    const sourceBlock = blockById.get(connection.fromBlockId);
    const targetBlock = blockById.get(connection.toBlockId);
    if (!sourceBlock || !targetBlock) return [];
    if (!isFoundationWorkflowBlock(sourceBlock)) return [];
    if (!isFoundationWorkflowBlock(targetBlock)) return [];
    if (sourceBlock.id === targetBlock.id) return [];

    const targetConfig = normalizeBlockConfig(targetBlock.config);
    const targetField = getTargetFieldForConnection(targetBlock, connection);
    if (!targetField) return [];
    const token = getFoundationArrowInputToken(sourceBlock);
    const connectionId = getConnectionKey(connection);
    const sourceOutput = getFoundationSourceOutput(sourceBlock);

    return [
      {
        connectionId,
        sourceBlockId: sourceBlock.id,
        targetBlockId: targetBlock.id,
        sourceLabel: sourceBlock.label || String(sourceBlock.type),
        targetLabel: targetBlock.label || String(targetBlock.type),
        sourceType: String(sourceBlock.type),
        targetType: String(targetBlock.type),
        sourceName: getFoundationArrowSourceName(sourceBlock),
        sourceOutputLabel: sourceOutput.label,
        sourceOutputValue: sourceOutput.value,
        sourceOutputDisplayValue:
          typeof sourceOutput.value === "undefined"
            ? "No preview value yet"
            : formatFoundationOutputValue(sourceOutput.value),
        token,
        targetField,
        targetFieldLabel: getTargetFieldLabel(targetField),
        isApplied: isTokenApplied(targetConfig, targetField, token, connectionId),
        currentValue: targetConfig[targetField],
      },
    ];
  });
}

function upsertLinkedInputEntry(
  config: UnknownRecord,
  suggestion: FoundationArrowInputSuggestion,
  enabled: boolean,
) {
  const currentEntries = getLinkedInputs(config).filter((entry) => {
    return entry.connectionId !== suggestion.connectionId;
  });

  return [
    ...currentEntries,
    {
      connectionId: suggestion.connectionId,
      sourceBlockId: suggestion.sourceBlockId,
      targetBlockId: suggestion.targetBlockId,
      token: suggestion.token,
      targetField: suggestion.targetField,
      enabled,
    },
  ];
}

function applyTokenToValue(value: unknown, token: string) {
  if (typeof value === "string") {
    if (!value.trim()) return token;
    if (value.trim() === token) return value;
    return token;
  }

  if (typeof value === "undefined" || value === null) return token;
  return token;
}

function removeTokenFromValue(value: unknown, token: string) {
  if (typeof value !== "string") return value;
  return value.replace(token, "").replace(/\s{2,}/g, " ").trim();
}

export function applyFoundationArrowInputToBlocks(
  blocks: CustomToolBlock[],
  connections: FoundationWorkflowConnectionLike[] = [],
  connectionId?: string,
) {
  const suggestions = createFoundationArrowInputSuggestions(blocks, connections);
  const targetSuggestions = connectionId
    ? suggestions.filter((suggestion) => suggestion.connectionId === connectionId)
    : suggestions;

  if (targetSuggestions.length === 0) return blocks;

  const suggestionByTarget = new Map<string, FoundationArrowInputSuggestion[]>();
  for (const suggestion of targetSuggestions) {
    suggestionByTarget.set(suggestion.targetBlockId, [
      ...(suggestionByTarget.get(suggestion.targetBlockId) ?? []),
      suggestion,
    ]);
  }

  return blocks.map((block) => {
    const blockSuggestions = suggestionByTarget.get(block.id);
    if (!blockSuggestions || blockSuggestions.length === 0) return block;

    const nextConfig = { ...normalizeBlockConfig(block.config) };
    for (const suggestion of blockSuggestions) {
      nextConfig[suggestion.targetField] = applyTokenToValue(
        nextConfig[suggestion.targetField],
        suggestion.token,
      );
      nextConfig.linkedInputs = upsertLinkedInputEntry(nextConfig, suggestion, true);
    }

    return { ...block, config: nextConfig };
  });
}

export function removeFoundationArrowInputFromBlocks(
  blocks: CustomToolBlock[],
  connections: FoundationWorkflowConnectionLike[] = [],
  connectionId: string,
) {
  const suggestion = createFoundationArrowInputSuggestions(blocks, connections).find(
    (item) => item.connectionId === connectionId,
  );
  if (!suggestion) return blocks;

  return blocks.map((block) => {
    if (block.id !== suggestion.targetBlockId) return block;

    const nextConfig = { ...normalizeBlockConfig(block.config) };
    nextConfig[suggestion.targetField] = removeTokenFromValue(
      nextConfig[suggestion.targetField],
      suggestion.token,
    );
    nextConfig.linkedInputs = getLinkedInputs(nextConfig).filter((entry) => {
      return entry.connectionId !== suggestion.connectionId;
    });

    return { ...block, config: nextConfig };
  });
}
