import {
  isFoundationCustomToolBlockType,
  type CustomToolBlock,
  type CustomToolFoundationBlockType,
} from "../../../domain/customToolTypes";
import { foundationDataTypes, type FoundationDataType } from "../foundationBlockTypes";
import type {
  FoundationBlockConfigValidationContext,
  FoundationBlockDiagnostic,
  FoundationDiagnosticSeverity,
  FoundationValidationResult,
  FoundationWorkflowValidationContext,
} from "./foundationValidationTypes";

const identifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const constantIdentifierPattern = /^[A-Z_$][A-Z0-9_$]*$/;

const validDataTypes = new Set<string>(foundationDataTypes);

function buildResult(
  diagnostics: FoundationBlockDiagnostic[],
): FoundationValidationResult {
  return {
    diagnostics,
    hasErrors: diagnostics.some((item) => item.severity === "error"),
    hasWarnings: diagnostics.some((item) => item.severity === "warning"),
  };
}

function createDiagnostic(
  context: FoundationBlockConfigValidationContext,
  severity: FoundationDiagnosticSeverity,
  field: string,
  message: string,
  suggestion?: string,
): FoundationBlockDiagnostic {
  return {
    id: `${context.blockId}:${field}:${severity}`,
    blockId: context.blockId,
    blockType: context.blockType,
    severity,
    field,
    message,
    suggestion,
  };
}

function addDiagnostic(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
  severity: FoundationDiagnosticSeverity,
  field: string,
  message: string,
  suggestion?: string,
) {
  diagnostics.push(
    createDiagnostic(context, severity, field, message, suggestion),
  );
}

function readString(
  config: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = config[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(
  config: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = config[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function readBoolean(
  config: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const value = config[key];
  return typeof value === "boolean" ? value : undefined;
}

function readArray(
  config: Record<string, unknown>,
  key: string,
): unknown[] | undefined {
  const value = config[key];
  return Array.isArray(value) ? value : undefined;
}

function isKnownDataType(value: unknown): value is FoundationDataType {
  return typeof value === "string" && validDataTypes.has(value);
}

function requireIdentifier(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
  field: string,
  label: string,
) {
  const value = readString(context.config, field)?.trim();

  if (!value) {
    addDiagnostic(
      diagnostics,
      context,
      "error",
      field,
      `${label} is required.`,
      "Use a clear identifier, for example result, filePath, or runAutomation.",
    );
    return;
  }

  if (!identifierPattern.test(value)) {
    addDiagnostic(
      diagnostics,
      context,
      "error",
      field,
      `${label} must be a valid identifier.`,
      "Start with a letter, underscore, or $, then use letters, numbers, underscores, or $.",
    );
  }
}

function validateDataType(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
  field = "dataType",
) {
  const value = context.config[field];

  if (value === undefined) return;

  if (!isKnownDataType(value)) {
    addDiagnostic(
      diagnostics,
      context,
      "warning",
      field,
      `Unknown data type: ${String(value)}.`,
      `Use one of: ${foundationDataTypes.join(", ")}.`,
    );
  }
}

function validateParameters(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  const parameters = readArray(context.config, "parameters");

  if (!parameters) {
    addDiagnostic(
      diagnostics,
      context,
      "warning",
      "parameters",
      "Function parameters should be an array.",
      "Use [] for no parameters or [{ name: 'input', dataType: 'string' }].",
    );
    return;
  }

  const seenNames = new Set<string>();

  parameters.forEach((parameter, index) => {
    if (!parameter || typeof parameter !== "object" || Array.isArray(parameter)) {
      addDiagnostic(
        diagnostics,
        context,
        "error",
        `parameters.${index}`,
        `Parameter #${index + 1} must be an object.`,
        "Use { name: 'value', dataType: 'string', required: true }.",
      );
      return;
    }

    const parameterConfig = parameter as Record<string, unknown>;
    const name = parameterConfig.name;

    if (typeof name !== "string" || !identifierPattern.test(name)) {
      addDiagnostic(
        diagnostics,
        context,
        "error",
        `parameters.${index}.name`,
        `Parameter #${index + 1} needs a valid name.`,
      );
      return;
    }

    if (seenNames.has(name)) {
      addDiagnostic(
        diagnostics,
        context,
        "error",
        `parameters.${index}.name`,
        `Duplicate parameter name: ${name}.`,
        "Each function parameter should have a unique name.",
      );
    }

    seenNames.add(name);

    const dataType = parameterConfig.dataType;
    if (dataType !== undefined && !isKnownDataType(dataType)) {
      addDiagnostic(
        diagnostics,
        context,
        "warning",
        `parameters.${index}.dataType`,
        `Parameter ${name} has an unknown data type.`,
      );
    }
  });
}

function validateCases(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  const cases = readArray(context.config, "cases");

  if (!cases) {
    addDiagnostic(
      diagnostics,
      context,
      "warning",
      "cases",
      "Switch cases should be an array.",
      "Use [] while designing, then add cases like { label: 'Admin', value: 'admin' }.",
    );
    return;
  }

  if (cases.length === 0) {
    addDiagnostic(
      diagnostics,
      context,
      "info",
      "cases",
      "No switch cases have been configured yet.",
    );
  }
}

function validateEntries(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  const entries = readArray(context.config, "entries");

  if (!entries) {
    addDiagnostic(
      diagnostics,
      context,
      "warning",
      "entries",
      "Dictionary entries should be an array.",
      "Use [] or entries like { key: 'name', value: 'Orosai' }.",
    );
    return;
  }

  entries.forEach((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      addDiagnostic(
        diagnostics,
        context,
        "error",
        `entries.${index}`,
        `Dictionary entry #${index + 1} must be an object.`,
        "Use { key: 'keyName', value: 'value' }.",
      );
      return;
    }

    const item = entry as Record<string, unknown>;
    if (item.key === undefined || item.key === "") {
      addDiagnostic(
        diagnostics,
        context,
        "warning",
        `entries.${index}.key`,
        `Dictionary entry #${index + 1} has no key.`,
      );
    }
  });
}

function validateVariableCreate(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  requireIdentifier(diagnostics, context, "name", "Variable name");
  validateDataType(diagnostics, context);

  const scope = readString(context.config, "scope");
  if (scope && scope !== "local" && scope !== "global") {
    addDiagnostic(
      diagnostics,
      context,
      "warning",
      "scope",
      "Variable scope should be local or global.",
    );
  }
}

function validateVariableAssign(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  requireIdentifier(diagnostics, context, "name", "Variable name");

  const expression = readString(context.config, "expression");
  if (!expression?.trim()) {
    addDiagnostic(
      diagnostics,
      context,
      "info",
      "expression",
      "Assignment has no expression yet.",
      "You can leave this empty while using a connected input port.",
    );
  }
}

function validateConstantCreate(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  requireIdentifier(diagnostics, context, "name", "Constant name");
  validateDataType(diagnostics, context);

  const name = readString(context.config, "name")?.trim();
  if (name && !constantIdentifierPattern.test(name)) {
    addDiagnostic(
      diagnostics,
      context,
      "info",
      "name",
      "Constants usually use UPPER_SNAKE_CASE.",
      "Example: API_BASE_URL or MAX_RETRIES.",
    );
  }

  if (!("value" in context.config)) {
    addDiagnostic(
      diagnostics,
      context,
      "warning",
      "value",
      "Constant has no value configured yet.",
    );
  }
}

function validateExpression(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  validateDataType(diagnostics, context);

  const expression = readString(context.config, "expression");
  if (!expression?.trim()) {
    addDiagnostic(
      diagnostics,
      context,
      "info",
      "expression",
      "Expression is empty.",
      "Use a literal, variable reference, or connected input depending on the final compiler step.",
    );
  }
}

function validateTemplateExpression(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  const template = readString(context.config, "template");
  if (!template?.trim()) {
    addDiagnostic(
      diagnostics,
      context,
      "info",
      "template",
      "Template is empty.",
      "Use placeholders like {{inputName}} or {{variableName}}.",
    );
  }
}

function validateScope(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  requireIdentifier(diagnostics, context, "namespace", "Scope namespace");
}

function validateFunctionDefine(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  requireIdentifier(diagnostics, context, "name", "Function name");
  validateParameters(diagnostics, context);

  const returnType = context.config.returnType;
  if (returnType !== undefined && !isKnownDataType(returnType)) {
    addDiagnostic(
      diagnostics,
      context,
      "warning",
      "returnType",
      `Unknown return type: ${String(returnType)}.`,
      `Use one of: ${foundationDataTypes.join(", ")}.`,
    );
  }

  const bodyBlockIds = readArray(context.config, "bodyBlockIds");
  if (bodyBlockIds && bodyBlockIds.length === 0) {
    addDiagnostic(
      diagnostics,
      context,
      "info",
      "bodyBlockIds",
      "Function body is empty.",
      "Connect or nest body blocks in a later structure step.",
    );
  }
}

function validateFunctionCall(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  const functionName = readString(context.config, "functionName");
  if (!functionName?.trim()) {
    addDiagnostic(
      diagnostics,
      context,
      "warning",
      "functionName",
      "Function call has no function name yet.",
      "Set functionName or connect a function reference input.",
    );
  } else if (!identifierPattern.test(functionName)) {
    addDiagnostic(
      diagnostics,
      context,
      "error",
      "functionName",
      "Function name must be a valid identifier.",
    );
  }

  const args = readArray(context.config, "arguments");
  if (!args) {
    addDiagnostic(
      diagnostics,
      context,
      "warning",
      "arguments",
      "Function arguments should be an array.",
    );
  }
}

function validateIf(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  const condition = readString(context.config, "condition");
  if (!condition?.trim()) {
    addDiagnostic(
      diagnostics,
      context,
      "info",
      "condition",
      "Condition is empty.",
      "You can type an expression or connect a boolean input port.",
    );
  }
}

function validateSwitch(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  const expression = readString(context.config, "expression");
  if (!expression?.trim()) {
    addDiagnostic(
      diagnostics,
      context,
      "info",
      "expression",
      "Switch expression is empty.",
    );
  }

  validateCases(diagnostics, context);
}

function validateForLoop(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  requireIdentifier(diagnostics, context, "indexName", "Index variable name");

  const start = readNumber(context.config, "start");
  const end = readNumber(context.config, "end");
  const step = readNumber(context.config, "step");

  if (start === undefined) {
    addDiagnostic(diagnostics, context, "warning", "start", "Loop start should be a number.");
  }

  if (end === undefined) {
    addDiagnostic(diagnostics, context, "warning", "end", "Loop end should be a number.");
  }

  if (step === 0) {
    addDiagnostic(
      diagnostics,
      context,
      "error",
      "step",
      "Loop step cannot be zero.",
    );
  }

  if (step === undefined) {
    addDiagnostic(diagnostics, context, "warning", "step", "Loop step should be a number.");
  }
}

function validateForEachLoop(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  requireIdentifier(diagnostics, context, "itemName", "Item variable name");
  requireIdentifier(diagnostics, context, "indexName", "Index variable name");
}

function validateWhileLoop(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  validateIf(diagnostics, context);

  const maxIterations = readNumber(context.config, "maxIterations");
  if (maxIterations === undefined || maxIterations <= 0) {
    addDiagnostic(
      diagnostics,
      context,
      "error",
      "maxIterations",
      "While loop needs a positive max iteration guard.",
      "Use a safe number like 100 to avoid infinite loops.",
    );
  }
}

function validateCollectionCreate(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  const itemType = context.config.itemType;
  if (itemType !== undefined && !isKnownDataType(itemType)) {
    addDiagnostic(
      diagnostics,
      context,
      "warning",
      "itemType",
      `Unknown item type: ${String(itemType)}.`,
    );
  }

  const items = readArray(context.config, "items");
  if (!items) {
    addDiagnostic(
      diagnostics,
      context,
      "warning",
      "items",
      "Collection items should be an array.",
    );
  }
}

function validateDictionary(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  const keyType = context.config.keyType;
  const valueType = context.config.valueType;

  if (keyType !== undefined && keyType !== "string") {
    addDiagnostic(
      diagnostics,
      context,
      "warning",
      "keyType",
      "Dictionary keys currently support string keys first.",
    );
  }

  if (valueType !== undefined && !isKnownDataType(valueType)) {
    addDiagnostic(
      diagnostics,
      context,
      "warning",
      "valueType",
      `Unknown value type: ${String(valueType)}.`,
    );
  }

  validateEntries(diagnostics, context);
}

function validateCollectionGetOrSet(
  diagnostics: FoundationBlockDiagnostic[],
  context: FoundationBlockConfigValidationContext,
) {
  if (!("key" in context.config) || context.config.key === "") {
    addDiagnostic(
      diagnostics,
      context,
      "info",
      "key",
      "No key or index configured yet.",
      "Set a key/index here or connect the key input port.",
    );
  }

  if (context.blockType === "collection.set" && !("value" in context.config)) {
    addDiagnostic(
      diagnostics,
      context,
      "warning",
      "value",
      "Set item has no value configured yet.",
      "Set a literal value or connect the value input port.",
    );
  }
}

export function validateFoundationBlockConfig(
  context: FoundationBlockConfigValidationContext,
): FoundationValidationResult {
  const diagnostics: FoundationBlockDiagnostic[] = [];

  switch (context.blockType) {
    case "variable.create":
      validateVariableCreate(diagnostics, context);
      break;
    case "variable.assign":
      validateVariableAssign(diagnostics, context);
      break;
    case "constant.create":
      validateConstantCreate(diagnostics, context);
      break;
    case "expression.value":
      validateExpression(diagnostics, context);
      break;
    case "expression.template":
      validateTemplateExpression(diagnostics, context);
      break;
    case "scope.global":
    case "scope.local":
      validateScope(diagnostics, context);
      break;
    case "function.define":
      validateFunctionDefine(diagnostics, context);
      break;
    case "function.call":
      validateFunctionCall(diagnostics, context);
      break;
    case "control.if":
      validateIf(diagnostics, context);
      break;
    case "control.switch":
      validateSwitch(diagnostics, context);
      break;
    case "loop.for":
      validateForLoop(diagnostics, context);
      break;
    case "loop.forEach":
      validateForEachLoop(diagnostics, context);
      break;
    case "loop.while":
      validateWhileLoop(diagnostics, context);
      break;
    case "collection.array":
    case "collection.list":
      validateCollectionCreate(diagnostics, context);
      break;
    case "collection.dictionary":
      validateDictionary(diagnostics, context);
      break;
    case "collection.get":
    case "collection.set":
      validateCollectionGetOrSet(diagnostics, context);
      break;
    default:
      break;
  }

  if (readBoolean(context.config, "_disabled") === true) {
    addDiagnostic(
      diagnostics,
      context,
      "info",
      "_disabled",
      "This foundation block is marked as disabled.",
    );
  }

  return buildResult(diagnostics);
}

export function validateFoundationWorkflowBlocks({
  blocks,
}: FoundationWorkflowValidationContext): FoundationValidationResult {
  const diagnostics = blocks.flatMap((block) => {
    if (!isFoundationCustomToolBlockType(block.type)) return [];

    return validateFoundationBlockConfig({
      blockId: block.id,
      blockType: block.type,
      config: block.config,
    }).diagnostics;
  });

  return buildResult(diagnostics);
}

export function validateFoundationBlock(block: CustomToolBlock): FoundationValidationResult {
  if (!isFoundationCustomToolBlockType(block.type)) {
    return buildResult([]);
  }

  return validateFoundationBlockConfig({
    blockId: block.id,
    blockType: block.type,
    config: block.config,
  });
}
