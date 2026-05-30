import type { CustomToolBlock } from "../../domain/customToolTypes";
import { validateFoundationBlock } from "../foundation";
import type { WorkflowConnection } from "../graph/workflowConnections";

export type WorkflowBlockDiagnostic = ReturnType<typeof validateFoundationBlock>["diagnostics"][number];

const fieldPortAliases: Record<string, string[]> = {
  value: ["value", "operand", "expression", "newValue", "initialValue", "result", "reference", "ref", "output"],
  expression: ["expression", "value", "operand", "result", "reference", "ref"],
  operand: ["operand", "value", "amount", "delta", "index"],
  initialValue: ["initialValue", "startValue", "defaultValue"],
  name: ["name", "variable", "variableName", "reference", "ref", "refVar"],
  start: ["start"],
  end: ["end", "limit", "to"],
  step: ["step"],
  left: ["left"],
  right: ["right"],
  condition: ["condition"],
  collection: ["collection", "items", "value"],
  items: ["items", "collection", "value"],
  key: ["key", "index"],
  arguments: ["arguments", "args", "value"],
  args: ["arguments", "args", "value"],
  bodyBlockIds: ["body", "iteration", "run"],
  trueBodyBlockIds: ["true"],
  falseBodyBlockIds: ["false"],
  defaultBodyBlockIds: ["default"],
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function fieldHasRuntimeValue(block: CustomToolBlock, field: string) {
  const config = (block.config ?? {}) as Record<string, unknown>;
  const value = config[field];
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function anyFieldHasRuntimeValue(block: CustomToolBlock, fields: string[]) {
  return fields.some((field) => fieldHasRuntimeValue(block, field));
}

function connectedInputPortsForBlock(block: CustomToolBlock, connections: WorkflowConnection[] = []) {
  return new Set(
    connections
      .filter((connection) => connection.toBlockId === block.id)
      .map((connection) => connection.toPortId ?? "input"),
  );
}

function isDiagnosticSatisfiedByRuntimeValue(
  block: CustomToolBlock,
  diagnostic: WorkflowBlockDiagnostic,
  connections: WorkflowConnection[] = [],
) {
  const field = asString(diagnostic.field);
  if (!field) return false;
  const linkedPorts = connectedInputPortsForBlock(block, connections);
  const aliases = fieldPortAliases[field] ?? [field];
  if (aliases.some((portId) => linkedPorts.has(portId))) return true;

  if (block.type === "loop.for" && ["start", "end", "step"].includes(field)) {
    return fieldHasRuntimeValue(block, field);
  }

  if (block.type === "io.output" && (field === "value" || field === "expression")) {
    return linkedPorts.has("value") || anyFieldHasRuntimeValue(block, ["value", "expression", "outputId", "name"]);
  }

  if (block.type === "variable.update") {
    if (field === "operand" || field === "value") return true;
    if (field === "initialValue") return true;
    if (field === "name") return aliases.some((portId) => linkedPorts.has(portId)) || fieldHasRuntimeValue(block, "name");
  }

  if (block.type === "variable.assign" && (field === "value" || field === "expression")) {
    return linkedPorts.has("value") || linkedPorts.has("expression") || anyFieldHasRuntimeValue(block, ["value", "expression"]);
  }

  return false;
}

export function getActionableFoundationDiagnostics(
  block: CustomToolBlock,
  connections: WorkflowConnection[] = [],
) {
  const validation = validateFoundationBlock(block);
  return validation.diagnostics.filter((diagnostic) => {
    if (isDiagnosticSatisfiedByRuntimeValue(block, diagnostic, connections)) return false;
    return true;
  });
}

export function countActionableDiagnostics(
  block: CustomToolBlock,
  connections: WorkflowConnection[] = [],
) {
  const diagnostics = getActionableFoundationDiagnostics(block, connections);
  const errors = diagnostics.filter((item) => item.severity === "error").length;
  const warnings = diagnostics.filter((item) => item.severity === "warning").length;
  const infos = diagnostics.length - errors - warnings;
  return { diagnostics, errors, warnings, infos, total: diagnostics.length };
}
