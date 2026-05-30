import type {
  CustomToolBlock,
  CustomToolInput,
  CustomToolInputType,
  CustomToolManifest,
  CustomToolOutput,
} from "../../domain/customToolTypes";

export type CanvasWorkflowConnectionLike = {
  id?: string;
  fromBlockId: string;
  toBlockId: string;
  fromPortId?: string;
  toPortId?: string;
  style?: string;
};

export type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function sanitizeId(value: string, fallback: string) {
  const cleaned = value
    .trim()
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!cleaned) return fallback;
  return /^[0-9]/.test(cleaned) ? `${fallback}_${cleaned}` : cleaned;
}

function normalizeInputType(value: unknown): CustomToolInputType {
  if (
    value === "text" ||
    value === "textarea" ||
    value === "file" ||
    value === "folder" ||
    value === "number" ||
    value === "boolean"
  ) {
    return value;
  }
  return "text";
}

function normalizeOutputType(value: unknown): CustomToolOutput["type"] {
  if (
    value === "text" ||
    value === "textarea" ||
    value === "file" ||
    value === "folder" ||
    value === "number" ||
    value === "boolean" ||
    value === "json" ||
    value === "array" ||
    value === "object" ||
    value === "unknown"
  ) {
    return value;
  }
  return "unknown";
}

export function isCanvasInputBlock(block: CustomToolBlock) {
  return block.type === "io.input";
}

export function isCanvasOutputBlock(block: CustomToolBlock) {
  return block.type === "io.output";
}

export function getCanvasInputId(block: CustomToolBlock) {
  const config = asRecord(block.config);
  return sanitizeId(asString(config.inputId, block.id), "input");
}

export function getCanvasOutputId(block: CustomToolBlock) {
  const config = asRecord(block.config);
  return sanitizeId(asString(config.outputId, block.id), "output");
}

export function getCanvasInputBlocks(draft: CustomToolManifest) {
  return draft.workflow.blocks.filter(isCanvasInputBlock);
}

export function getCanvasOutputBlocks(draft: CustomToolManifest) {
  return draft.workflow.blocks.filter(isCanvasOutputBlock);
}

export function deriveCanvasInputsFromBlocks(
  blocks: CustomToolBlock[],
): CustomToolInput[] {
  return blocks.filter(isCanvasInputBlock).map((block) => {
    const config = asRecord(block.config);
    const id = getCanvasInputId(block);
    return {
      id,
      label: block.label || id,
      type: normalizeInputType(config.dataType ?? config.type),
      required: asBoolean(config.required, true),
      description: asString(config.description, block.description || undefined),
      accept: Array.isArray(config.accept)
        ? config.accept.filter((item): item is string => typeof item === "string")
        : undefined,
    };
  });
}

export function deriveCanvasInputs(draft: CustomToolManifest): CustomToolInput[] {
  return deriveCanvasInputsFromBlocks(getCanvasInputBlocks(draft));
}

export function deriveCanvasOutputs(draft: CustomToolManifest): CustomToolOutput[] {
  return getCanvasOutputBlocks(draft).map((block) => {
    const config = asRecord(block.config);
    const id = getCanvasOutputId(block);
    return {
      id,
      label: block.label || id,
      type: normalizeOutputType(config.dataType ?? config.type),
      description: asString(config.description, block.description || undefined),
    };
  });
}

export function syncCanvasIoToManifest(draft: CustomToolManifest): CustomToolManifest {
  return {
    ...draft,
    inputs: deriveCanvasInputs(draft),
    outputs: deriveCanvasOutputs(draft),
  };
}

function defaultValueForInputType(type: CustomToolInputType) {
  if (type === "number") return 0;
  if (type === "boolean") return false;
  return "";
}

export function createCanvasInputTestValuesFromBlocks(
  blocks: CustomToolBlock[],
  existingValues: UnknownRecord = {},
) {
  const values: UnknownRecord = {};

  for (const block of blocks.filter(isCanvasInputBlock)) {
    const config = asRecord(block.config);
    const id = getCanvasInputId(block);
    const type = normalizeInputType(config.dataType ?? config.type);

    values[id] = Object.prototype.hasOwnProperty.call(existingValues, id)
      ? existingValues[id]
      : defaultValueForInputType(type);
  }

  return values;
}

export function createCanvasInputTestValues(
  draft: CustomToolManifest,
  existingValues: UnknownRecord = {},
) {
  return createCanvasInputTestValuesFromBlocks(
    getCanvasInputBlocks(draft),
    existingValues,
  );
}

function normalizeRuntimeName(value: string, fallback: string) {
  return sanitizeId(value, fallback);
}

function firstString(config: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = config[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function getArrowSourceRuntimeReference(
  block: CustomToolBlock,
  fromPortId?: string,
) {
  const config = asRecord(block.config);
  const blockType = String(block.type);

  if (fromPortId === "next" || fromPortId === "run") return "";

  if (blockType === "io.input") return getCanvasInputId(block);
  if (blockType === "io.output") return getCanvasOutputId(block);

  if (blockType === "loop.for") {
    if (fromPortId === "index") {
      return normalizeRuntimeName(firstString(config, ["indexName", "variable"]), "i");
    }
    if (fromPortId === "iterations") return "iterations";
  }

  if (blockType === "loop.forEach") {
    if (fromPortId === "item") return normalizeRuntimeName(firstString(config, ["itemName"]), "item");
    if (fromPortId === "index") return normalizeRuntimeName(firstString(config, ["indexName"]), "index");
  }

  if (blockType === "variable.create" || blockType === "variable.assign" || blockType === "variable.update") {
    return normalizeRuntimeName(firstString(config, ["name", "variableName"]), "value");
  }

  if (blockType === "constant.create") {
    return normalizeRuntimeName(firstString(config, ["name", "constantName"]), "constant");
  }

  if (blockType === "math.operation" || blockType === "logic.compare") {
    return normalizeRuntimeName(firstString(config, ["resultName", "outputName", "assignTo"]), "result");
  }

  if (blockType === "function.call") {
    const assignTo = firstString(config, ["assignTo", "outputName", "resultName"]);
    if (assignTo) return normalizeRuntimeName(assignTo, "result");
  }

  const explicit = firstString(config, ["outputName", "resultName", "name", "key"]);
  if (explicit) return normalizeRuntimeName(explicit, "value");
  return normalizeRuntimeName(block.label || block.id, "value");
}

function getConnectionTargetField(
  targetBlock: CustomToolBlock,
  connection: CanvasWorkflowConnectionLike,
) {
  const toPortId = connection.toPortId;
  const targetType = String(targetBlock.type);

  // Run/order ports are execution arrows, never data assignment.
  if (!toPortId || toPortId === "run" || toPortId === "input" || toPortId === "output") {
    return null;
  }

  if (targetType === "variable.create") {
    if (toPortId === "initialValue" || toPortId === "value") return "initialValue";
  }

  if (targetType === "variable.assign") {
    if (toPortId === "value" || toPortId === "expression") return "value";
  }

  if (targetType === "variable.update") {
    if (toPortId === "operand" || toPortId === "value") return "operand";
    if (toPortId === "initialValue") return "initialValue";
  }

  if (targetType === "math.operation" || targetType === "logic.compare") {
    if (toPortId === "left" || toPortId === "right") return toPortId;
  }

  if (targetType === "loop.for") {
    if (toPortId === "start" || toPortId === "end" || toPortId === "step") return toPortId;
  }

  if (targetType === "control.if" && toPortId === "condition") return "condition";
  if (targetType === "loop.while" && toPortId === "condition") return "condition";
  if (targetType === "control.switch" && toPortId === "value") return "expression";

  if (targetType === "function.call" && (toPortId === "arguments" || toPortId === "args")) {
    return "arguments";
  }

  if (targetType === "io.output" && toPortId === "value") return "value";
  if (targetType === "expression.value" && toPortId === "value") return "expression";
  if (targetType === "expression.template" && toPortId === "value") return "template";
  if (targetType === "constant.create" && toPortId === "value") return "value";

  if (["collection", "key", "items", "value"].includes(toPortId)) return toPortId;

  return null;
}

function isBodyPort(connection: CanvasWorkflowConnectionLike) {
  const port = connection.fromPortId ?? "output";
  return (
    port === "body" ||
    port === "iteration" ||
    port === "true" ||
    port === "false" ||
    port === "matched" ||
    port === "default"
  );
}

function applyValueToField(
  config: UnknownRecord,
  field: string,
  sourceReference: string,
) {
  if (!sourceReference) return config;

  if (field === "arguments" || field === "args") {
    const current = Array.isArray(config.arguments)
      ? [...config.arguments]
      : Array.isArray(config.args)
        ? [...config.args]
        : [];
    return { ...config, arguments: [...current, sourceReference] };
  }

  return { ...config, [field]: sourceReference };
}

export function materializeArrowDataLinks(
  blocks: CustomToolBlock[],
  connections: CanvasWorkflowConnectionLike[] = [],
) {
  if (connections.length === 0) return blocks;

  const blockById = new Map(blocks.map((block) => [block.id, block]));
  const configByBlockId = new Map<string, UnknownRecord>();

  for (const connection of connections) {
    if (isBodyPort(connection)) continue;

    const sourceBlock = blockById.get(connection.fromBlockId);
    const targetBlock = blockById.get(connection.toBlockId);
    if (!sourceBlock || !targetBlock) continue;

    const field = getConnectionTargetField(targetBlock, connection);
    if (!field) continue;

    const sourceReference = getArrowSourceRuntimeReference(sourceBlock, connection.fromPortId);
    if (!sourceReference) continue;

    const targetConfig = configByBlockId.get(targetBlock.id) ?? asRecord(targetBlock.config);
    configByBlockId.set(
      targetBlock.id,
      applyValueToField(targetConfig, field, sourceReference),
    );
  }

  if (configByBlockId.size === 0) return blocks;

  return blocks.map((block) => {
    const nextConfig = configByBlockId.get(block.id);
    return nextConfig ? { ...block, config: nextConfig } : block;
  });
}
