import type { CustomToolBlock } from "../../domain/customToolTypes";
import { validateFoundationBlock } from "../foundation";
import type { WorkflowConnection } from "../graph/workflowConnections";

export type WorkflowBlockDiagnostic = ReturnType<typeof validateFoundationBlock>["diagnostics"][number];

const fieldPortAliases: Record<string, string[]> = {
  value: ["value", "operand", "expression", "newValue", "initialValue"],
  expression: ["expression", "value", "operand"],
  operand: ["operand", "value"],
  initialValue: ["initialValue", "startValue", "defaultValue", "value"],
  start: ["start"],
  end: ["end"],
  step: ["step"],
  left: ["left"],
  right: ["right"],
  condition: ["condition"],
  collection: ["collection", "items", "value"],
  items: ["items", "collection", "value"],
  key: ["key"],
  arguments: ["arguments", "args", "value"],
  args: ["arguments", "args", "value"],
  bodyBlockIds: ["body", "iteration"],
  trueBodyBlockIds: ["true"],
  falseBodyBlockIds: ["false"],
  defaultBodyBlockIds: ["default"],
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function fieldHasManualValue(block: CustomToolBlock, field: string) {
  const config = block.config ?? {};
  const value = (config as Record<string, unknown>)[field];
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function anyFieldHasManualValue(block: CustomToolBlock, fields: string[]) {
  return fields.some((field) => fieldHasManualValue(block, field));
}

function connectedInputPortsForBlock(
  block: CustomToolBlock,
  connections: WorkflowConnection[] = [],
) {
  return new Set(
    connections
      .filter((connection) => connection.toBlockId === block.id)
      .map((connection) => connection.toPortId ?? "input"),
  );
}

function isDiagnosticSatisfiedByArrow(
  block: CustomToolBlock,
  diagnostic: WorkflowBlockDiagnostic,
  connections: WorkflowConnection[] = [],
) {
  const field = asString(diagnostic.field);
  if (!field) return false;

  const linkedPorts = connectedInputPortsForBlock(block, connections);
  const aliases = fieldPortAliases[field] ?? [field];
  if (aliases.some((portId) => linkedPorts.has(portId))) return true;

  // variable.update is intentionally simplified for users: a value arrow into
  // either value/operand satisfies the same required update value.
  if (block.type === "variable.update" && field === "operand") {
    return linkedPorts.has("value") || linkedPorts.has("operand");
  }

  if (block.type === "variable.update" && field === "initialValue") {
    return !anyFieldHasManualValue(block, ["initialValue", "startValue", "defaultValue"]);
  }

  if (block.type === "io.output" && (field === "expression" || field === "value")) {
    return linkedPorts.has("value") || fieldHasManualValue(block, "value");
  }

  if (block.type === "variable.assign" && field === "value") {
    return linkedPorts.has("value") || linkedPorts.has("expression");
  }

  return false;
}

export function getActionableFoundationDiagnostics(
  block: CustomToolBlock,
  connections: WorkflowConnection[] = [],
) {
  const validation = validateFoundationBlock(block);
  return validation.diagnostics.filter((diagnostic) => {
    if (isDiagnosticSatisfiedByArrow(block, diagnostic, connections)) return false;
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
