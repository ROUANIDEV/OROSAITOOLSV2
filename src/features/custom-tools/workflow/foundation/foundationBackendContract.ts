import {
  isFoundationCustomToolBlockType,
  type CustomToolBlockType,
  type CustomToolFoundationBlockType,
} from "../../domain/customToolTypes";
import { getFoundationBlockDefinition } from "./foundationBlockRegistry";

export type FoundationBackendContractStatus =
  | "ready-for-rust-handler"
  | "needs-config"
  | "model-only";

export type FoundationBackendContract = {
  schemaVersion: 1;
  blockKind: CustomToolFoundationBlockType;
  category: string;
  title: string;
  displayName: string;
  status: FoundationBackendContractStatus;
  rustHandler: string;
  requiredPermissions: string[];
  diagnostics: string[];
  reads: string[];
  writes: string[];
  produces: string[];
  instruction: { op: string; args: Record<string, unknown> };
  pseudoCode: string;
};

const knownDataTypes = new Set([
  "string",
  "number",
  "boolean",
  "json",
  "array",
  "list",
  "dictionary",
  "object",
  "file",
  "folder",
  "void",
  "unknown",
]);

function hasOwn(config: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(config, key);
}

function getString(config: Record<string, unknown>, key: string, fallback = "") {
  const value = config[key];
  return typeof value === "string" ? value : fallback;
}

function getExpressionValue(
  config: Record<string, unknown>,
  key: string,
  fallback: string | number | boolean,
) {
  const value = config[key];
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return fallback;
}

function getBoolean(config: Record<string, unknown>, key: string, fallback: boolean) {
  const value = config[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

function getArray(config: Record<string, unknown>, key: string): unknown[] {
  const value = config[key];
  return Array.isArray(value) ? value : [];
}

function getDataType(config: Record<string, unknown>, fallback = "unknown") {
  const value = getString(config, "dataType", getString(config, "type", fallback));
  return knownDataTypes.has(value) ? value : fallback;
}

function asName(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeRustHandler(kind: CustomToolFoundationBlockType) {
  return `custom_tools::foundation::${kind.replace(/\./g, "_")}`;
}

function isIdentifier(value: string) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function createBaseContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
): FoundationBackendContract {
  const definition = getFoundationBlockDefinition(blockKind);
  return {
    schemaVersion: 1,
    blockKind,
    category: definition.category,
    title: definition.title,
    displayName: definition.defaultLabel,
    status: "model-only",
    rustHandler: normalizeRustHandler(blockKind),
    requiredPermissions: [],
    diagnostics: [],
    reads: [],
    writes: [],
    produces: definition.outputs.map((port) => port.id),
    instruction: { op: blockKind.replace(/\./g, ":"), args: { ...config } },
    pseudoCode: `${definition.title};`,
  };
}

function markReadyWhenNoDiagnostics(contract: FoundationBackendContract) {
  return {
    ...contract,
    status:
      contract.diagnostics.length > 0 ? "needs-config" : "ready-for-rust-handler",
  } satisfies FoundationBackendContract;
}

function validateIdentifier(
  contract: FoundationBackendContract,
  value: string,
  label: string,
) {
  if (!value.trim()) {
    contract.diagnostics.push(`${label} is required.`);
    return;
  }
  if (!isIdentifier(value)) {
    contract.diagnostics.push(
      `${label} must be a valid identifier, for example n, result, or factorialResult.`,
    );
  }
}

function createIoContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
) {
  const contract = createBaseContract(blockKind, config);

  if (blockKind === "io.input") {
    const inputId = asName(getString(config, "inputId", getString(config, "name")), "input");
    const dataType = getDataType(config, "text");
    contract.displayName = inputId;
    contract.writes = [inputId];
    contract.produces = ["value"];
    contract.instruction = {
      op: "read_canvas_input",
      args: {
        inputId,
        dataType,
        required: getBoolean(config, "required", true),
        defaultValue: hasOwn(config, "defaultValue") ? config.defaultValue : null,
      },
    };
    contract.pseudoCode = `input ${inputId}: ${dataType};`;
    validateIdentifier(contract, inputId, "Input ID");
  }

  if (blockKind === "io.output") {
    const outputId = asName(getString(config, "outputId", getString(config, "name")), "result");
    const expression = getString(config, "expression", getString(config, "value"));
    const dataType = getDataType(config, "unknown");
    contract.displayName = outputId;
    contract.reads = expression ? [expression] : [];
    contract.writes = [outputId];
    contract.produces = ["value"];
    contract.instruction = {
      op: "write_canvas_output",
      args: { outputId, expression, dataType },
    };
    contract.pseudoCode = `output ${outputId} = ${expression || "<empty>"};`;
    validateIdentifier(contract, outputId, "Output ID");
    if (!expression.trim()) contract.diagnostics.push("Output expression is empty.");
  }

  return markReadyWhenNoDiagnostics(contract);
}

function createVariableContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
) {
  const contract = createBaseContract(blockKind, config);
  const name = asName(getString(config, "name"), "value");
  const dataType = getDataType(config);
  const expression = hasOwn(config, "expression")
    ? config.expression
    : hasOwn(config, "initialValue")
      ? config.initialValue
      : config.value;
  contract.displayName = name;
  contract.writes = [name];
  contract.instruction = {
    op: blockKind === "variable.assign" ? "assign_variable" : "declare_variable",
    args: { name, dataType, value: expression },
  };
  contract.pseudoCode =
    blockKind === "variable.assign"
      ? `${name} = ${String(expression ?? "")};`
      : `let ${name}: ${dataType} = ${String(expression ?? "null")};`;
  validateIdentifier(contract, name, "Variable name");
  if (blockKind === "variable.assign" && !String(expression ?? "").trim()) {
    contract.diagnostics.push("Assignment expression is empty.");
  }
  return markReadyWhenNoDiagnostics(contract);
}

function createConstantContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
) {
  const contract = createBaseContract(blockKind, config);
  const name = asName(getString(config, "name"), "CONST_VALUE");
  const dataType = getDataType(config, "string");
  const value = hasOwn(config, "value") ? config.value : "";
  contract.displayName = name;
  contract.writes = [name];
  contract.instruction = { op: "declare_constant", args: { name, dataType, value } };
  contract.pseudoCode = `const ${name}: ${dataType} = ${JSON.stringify(value)};`;
  validateIdentifier(contract, name, "Constant name");
  return markReadyWhenNoDiagnostics(contract);
}

function createExpressionContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
) {
  const contract = createBaseContract(blockKind, config);
  const expression = getString(config, "expression");
  const template = getString(config, "template");

  if (blockKind === "expression.template") {
    contract.displayName = template ? "template" : "empty template";
    contract.instruction = { op: "render_template", args: { template } };
    contract.pseudoCode = `render_template(${JSON.stringify(template)});`;
    if (!template.trim()) contract.diagnostics.push("Template is empty.");
  } else {
    contract.displayName = expression || "expression";
    contract.reads = expression ? [expression] : [];
    contract.instruction = {
      op: "evaluate_expression",
      args: { expression, dataType: getDataType(config) },
    };
    contract.pseudoCode = expression || ";";
    if (!expression.trim()) contract.diagnostics.push("Expression is empty.");
  }

  return markReadyWhenNoDiagnostics(contract);
}

function createFunctionContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
) {
  const contract = createBaseContract(blockKind, config);

  if (blockKind === "function.define") {
    const name = asName(getString(config, "name"), "run");
    const parameters = getArray(config, "parameters");
    const returnExpression = getString(config, "returnExpression");
    contract.displayName = `${name}()`;
    contract.writes = [name];
    contract.reads = returnExpression ? [returnExpression] : [];
    contract.instruction = {
      op: "define_function",
      args: {
        name,
        parameters,
        returnType: getDataType(config, "unknown"),
        bodyBlockIds: getArray(config, "bodyBlockIds"),
        returnExpression,
      },
    };
    contract.pseudoCode = `function ${name}(${parameters.map(String).join(", ")}) { return ${returnExpression || "void"}; }`;
    validateIdentifier(contract, name, "Function name");
  }

  if (blockKind === "function.call") {
    const functionName = asName(getString(config, "functionName"), "functionName");
    const args = getArray(config, "arguments");
    const assignTo = getString(config, "assignTo");
    contract.displayName = `${functionName}()`;
    contract.reads = [functionName, ...args.map(String)];
    if (assignTo) contract.writes = [assignTo];
    contract.instruction = { op: "call_function", args: { functionName, arguments: args, assignTo } };
    contract.pseudoCode = `${assignTo ? `${assignTo} = ` : ""}${functionName}(${args.map(String).join(", ")});`;
    validateIdentifier(contract, functionName, "Function call name");
    if (assignTo) validateIdentifier(contract, assignTo, "Function result variable");
  }

  return markReadyWhenNoDiagnostics(contract);
}

function createControlContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
) {
  const contract = createBaseContract(blockKind, config);
  const expression = getString(config, blockKind === "control.if" ? "condition" : "expression");
  contract.displayName = expression || blockKind;
  contract.reads = expression ? [expression] : [];
  contract.instruction = {
    op: blockKind === "control.if" ? "branch_if" : "branch_switch",
    args: { ...config, expression },
  };
  contract.pseudoCode =
    blockKind === "control.if"
      ? `if (${expression}) { ... }`
      : `switch (${expression}) { ... }`;
  if (!expression.trim()) contract.diagnostics.push("Condition/expression is empty.");
  return markReadyWhenNoDiagnostics(contract);
}

function createLoopContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
) {
  const contract = createBaseContract(blockKind, config);

  if (blockKind === "loop.for") {
    const indexName = asName(getString(config, "indexName"), "i");
    const start = getExpressionValue(config, "start", 0);
    const end = getExpressionValue(config, "end", 10);
    const step = getExpressionValue(config, "step", 1);
    contract.displayName = `${indexName}: ${String(start)}..${String(end)}`;
    contract.reads = [String(start), String(end), String(step)].filter(Boolean);
    contract.writes = [indexName];
    contract.instruction = {
      op: "loop_for",
      args: {
        indexName,
        start,
        end,
        step,
        inclusiveEnd: getBoolean(config, "inclusiveEnd", false),
        bodyBlockIds: getArray(config, "bodyBlockIds"),
      },
    };
    contract.pseudoCode = `for ${indexName} from ${String(start)} to ${String(end)} step ${String(step)} { ... }`;
    validateIdentifier(contract, indexName, "Loop index name");
    if (String(step).trim() === "0") contract.diagnostics.push("For loop step cannot be 0.");
  }

  if (blockKind === "loop.forEach") {
    const itemName = asName(getString(config, "itemName"), "item");
    const collection = getString(config, "collection", "items");
    contract.displayName = `${itemName} in ${collection}`;
    contract.reads = [collection];
    contract.writes = [itemName];
    contract.instruction = { op: "loop_for_each", args: { ...config, itemName, collection } };
    contract.pseudoCode = `for ${itemName} of ${collection} { ... }`;
    validateIdentifier(contract, itemName, "Loop item name");
  }

  if (blockKind === "loop.while") {
    const condition = getString(config, "condition");
    contract.displayName = condition || "while";
    contract.reads = condition ? [condition] : [];
    contract.instruction = { op: "loop_while", args: { ...config, condition } };
    contract.pseudoCode = `while (${condition}) { ... }`;
    if (!condition.trim()) contract.diagnostics.push("While condition is empty.");
  }

  return markReadyWhenNoDiagnostics(contract);
}

function createCollectionContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
) {
  const contract = createBaseContract(blockKind, config);
  contract.displayName = blockKind.replace("collection.", "");
  contract.instruction = { op: blockKind.replace("collection.", "collection_"), args: { ...config } };
  contract.pseudoCode = `${contract.instruction.op}(...);`;
  return markReadyWhenNoDiagnostics(contract);
}

export function createFoundationBackendContract(
  blockType: CustomToolBlockType,
  config: Record<string, unknown>,
): FoundationBackendContract | null {
  if (!isFoundationCustomToolBlockType(blockType)) return null;

  switch (blockType) {
    case "io.input":
    case "io.output":
      return createIoContract(blockType, config);
    case "variable.create":
    case "variable.assign":
      return createVariableContract(blockType, config);
    case "constant.create":
      return createConstantContract(blockType, config);
    case "expression.value":
    case "expression.template":
      return createExpressionContract(blockType, config);
    case "scope.global":
    case "scope.local":
      return markReadyWhenNoDiagnostics(createBaseContract(blockType, config));
    case "function.define":
    case "function.call":
      return createFunctionContract(blockType, config);
    case "control.if":
    case "control.switch":
      return createControlContract(blockType, config);
    case "loop.for":
    case "loop.forEach":
    case "loop.while":
      return createLoopContract(blockType, config);
    case "collection.array":
    case "collection.list":
    case "collection.dictionary":
    case "collection.get":
    case "collection.set":
    case "collection.sort":
      return createCollectionContract(blockType, config);
    default:
      return createBaseContract(blockType, config);
  }
}
