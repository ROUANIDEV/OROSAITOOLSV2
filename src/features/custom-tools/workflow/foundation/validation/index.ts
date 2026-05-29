import {
  isFoundationCustomToolBlockType,
  type CustomToolBlock,
} from "../../../domain/customToolTypes";
import type {
  FoundationBlockKind,
  FoundationDataType,
} from "../foundationBlockTypes";
import {
  checkFoundationTypedValue,
  getFoundationRuntimeValueKind,
} from "../type-checking";

export type FoundationDiagnosticSeverity = "error" | "warning" | "info";

export type FoundationBlockDiagnostic = {
  id: string;
  severity: FoundationDiagnosticSeverity;
  title: string;
  message: string;
  field?: string;
};
export type FoundationValidationResult = {
  diagnostics: FoundationBlockDiagnostic[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  hasErrors: boolean;
  hasWarnings: boolean;
};

function buildFoundationValidationResult(
  diagnostics: FoundationBlockDiagnostic[],
): FoundationValidationResult {
  const errorCount = diagnostics.filter(
    (diagnostic) => diagnostic.severity === "error",
  ).length;
  const warningCount = diagnostics.filter(
    (diagnostic) => diagnostic.severity === "warning",
  ).length;
  const infoCount = diagnostics.filter(
    (diagnostic) => diagnostic.severity === "info",
  ).length;

  return {
    diagnostics,
    errorCount,
    warningCount,
    infoCount,
    hasErrors: errorCount > 0,
    hasWarnings: warningCount > 0,
  };
}


type FoundationValidationInput = {
  blockType?: FoundationBlockKind;
  type?: FoundationBlockKind;
  kind?: FoundationBlockKind;
  config: Record<string, unknown>;
};

const identifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const constantPattern = /^[A-Z_$][A-Z0-9_$]*$/;

function stringConfig(
  config: Record<string, unknown>,
  key: string,
  fallback = "",
) {
  const value = config[key];
  return typeof value === "string" ? value : fallback;
}

function numberConfig(
  config: Record<string, unknown>,
  key: string,
  fallback = 0,
) {
  const value = config[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function dataTypeConfig(config: Record<string, unknown>) {
  const value = config.dataType;
  return typeof value === "string" && value.length > 0
    ? (value as FoundationDataType)
    : "unknown";
}

function diagnostic(
  id: string,
  severity: FoundationDiagnosticSeverity,
  title: string,
  message: string,
  field?: string,
): FoundationBlockDiagnostic {
  return { id, severity, title, message, field };
}

function validateIdentifier(
  diagnostics: FoundationBlockDiagnostic[],
  value: string,
  field: string,
  label: string,
) {
  if (!value.trim()) {
    diagnostics.push(
      diagnostic(
        `${field}-required`,
        "error",
        `${label} is required`,
        `${label} must be set before this block can be compiled or executed.`,
        field,
      ),
    );
    return;
  }

  if (!identifierPattern.test(value)) {
    diagnostics.push(
      diagnostic(
        `${field}-invalid`,
        "error",
        `Invalid ${label.toLowerCase()}`,
        `${label} must be a valid identifier. Use names like project, filePath, or total_count. Do not start with a number and do not use spaces.`,
        field,
      ),
    );
  }
}

function validateConstantIdentifier(
  diagnostics: FoundationBlockDiagnostic[],
  value: string,
) {
  validateIdentifier(diagnostics, value, "name", "Constant name");

  if (value && identifierPattern.test(value) && !constantPattern.test(value)) {
    diagnostics.push(
      diagnostic(
        "constant-name-style",
        "warning",
        "Constant naming style",
        "Constants should usually use uppercase names like API_URL or MAX_RETRIES.",
        "name",
      ),
    );
  }
}

function validateTypedConfigValue(
  diagnostics: FoundationBlockDiagnostic[],
  options: {
    dataType: FoundationDataType | string | undefined;
    value: unknown;
    field: string;
    label: string;
  },
) {
  const check = checkFoundationTypedValue(options.dataType, options.value);

  if (!check.ok) {
    diagnostics.push(
      diagnostic(
        `${options.field}-type-mismatch`,
        "error",
        `${options.label} type mismatch`,
        check.message ??
          `${options.label} does not match configured type ${String(
            options.dataType,
          )}.`,
        options.field,
      ),
    );
  }
}

function validateFunctionParameters(
  diagnostics: FoundationBlockDiagnostic[],
  config: Record<string, unknown>,
) {
  const parameters = config.parameters;

  if (typeof parameters === "undefined") return;

  if (!Array.isArray(parameters)) {
    diagnostics.push(
      diagnostic(
        "parameters-invalid",
        "error",
        "Invalid parameters",
        "Function parameters must be an array.",
        "parameters",
      ),
    );
    return;
  }

  parameters.forEach((parameter, index) => {
    if (!parameter || typeof parameter !== "object" || Array.isArray(parameter)) {
      diagnostics.push(
        diagnostic(
          `parameter-${index}-invalid`,
          "error",
          "Invalid parameter",
          `Parameter #${index + 1} must be an object with name and type fields.`,
          "parameters",
        ),
      );
      return;
    }

    const parameterConfig = parameter as Record<string, unknown>;
    const name = stringConfig(parameterConfig, "name");

    if (!name || !identifierPattern.test(name)) {
      diagnostics.push(
        diagnostic(
          `parameter-${index}-name-invalid`,
          "error",
          "Invalid parameter name",
          `Parameter #${index + 1} must have a valid identifier name.`,
          "parameters",
        ),
      );
    }
  });
}

function validateDictionaryEntries(
  diagnostics: FoundationBlockDiagnostic[],
  config: Record<string, unknown>,
) {
  const entries = config.entries;

  if (typeof entries === "undefined") return;

  if (!Array.isArray(entries)) {
    diagnostics.push(
      diagnostic(
        "entries-invalid",
        "error",
        "Invalid dictionary entries",
        "Dictionary entries must be an array of { key, value } objects.",
        "entries",
      ),
    );
    return;
  }

  entries.forEach((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      diagnostics.push(
        diagnostic(
          `entry-${index}-invalid`,
          "error",
          "Invalid dictionary entry",
          `Entry #${index + 1} must be an object with key and value fields.`,
          "entries",
        ),
      );
      return;
    }

    const entryConfig = entry as Record<string, unknown>;
    const key = entryConfig.key;

    if (typeof key !== "string" || key.trim().length === 0) {
      diagnostics.push(
        diagnostic(
          `entry-${index}-key-invalid`,
          "error",
          "Invalid dictionary key",
          `Entry #${index + 1} must have a non-empty string key.`,
          "entries",
        ),
      );
    }
  });
}

function validateVariableCreate(
  diagnostics: FoundationBlockDiagnostic[],
  config: Record<string, unknown>,
) {
  validateIdentifier(diagnostics, stringConfig(config, "name", "value"), "name", "Variable name");
  validateTypedConfigValue(diagnostics, {
    dataType: dataTypeConfig(config),
    value: config.initialValue,
    field: "initialValue",
    label: "Initial value",
  });
}

function validateVariableAssign(
  diagnostics: FoundationBlockDiagnostic[],
  config: Record<string, unknown>,
) {
  validateIdentifier(diagnostics, stringConfig(config, "name", "value"), "name", "Variable name");

  if (
    typeof config.expression === "undefined" ||
    (typeof config.expression === "string" && config.expression.trim().length === 0)
  ) {
    diagnostics.push(
      diagnostic(
        "expression-empty",
        "warning",
        "Assignment expression is empty",
        "This assignment currently has no expression/value to write into the variable.",
        "expression",
      ),
    );
  }
}

function validateConstantCreate(
  diagnostics: FoundationBlockDiagnostic[],
  config: Record<string, unknown>,
) {
  validateConstantIdentifier(diagnostics, stringConfig(config, "name", "CONST_VALUE"));
  validateTypedConfigValue(diagnostics, {
    dataType: dataTypeConfig(config),
    value: config.value,
    field: "value",
    label: "Constant value",
  });
}

function validateExpressionValue(
  diagnostics: FoundationBlockDiagnostic[],
  config: Record<string, unknown>,
) {
  if (
    typeof config.expression === "undefined" ||
    (typeof config.expression === "string" && config.expression.trim().length === 0)
  ) {
    diagnostics.push(
      diagnostic(
        "expression-empty",
        "info",
        "Expression is empty",
        "Set an expression or literal value to make this block produce useful output.",
        "expression",
      ),
    );
    return;
  }

  validateTypedConfigValue(diagnostics, {
    dataType: dataTypeConfig(config),
    value: config.expression,
    field: "expression",
    label: "Expression value",
  });
}

function validateFunctionDefine(
  diagnostics: FoundationBlockDiagnostic[],
  config: Record<string, unknown>,
) {
  validateIdentifier(diagnostics, stringConfig(config, "name", "run"), "name", "Function name");
  validateFunctionParameters(diagnostics, config);
}

function validateFunctionCall(
  diagnostics: FoundationBlockDiagnostic[],
  config: Record<string, unknown>,
) {
  validateIdentifier(diagnostics, stringConfig(config, "functionName"), "functionName", "Function name");

  if (typeof config.arguments !== "undefined" && !Array.isArray(config.arguments)) {
    diagnostics.push(
      diagnostic(
        "arguments-invalid",
        "error",
        "Invalid function arguments",
        "Function arguments must be an array.",
        "arguments",
      ),
    );
  }
}

function validateIfOrWhile(
  diagnostics: FoundationBlockDiagnostic[],
  config: Record<string, unknown>,
  blockLabel: string,
) {
  if (
    typeof config.condition === "undefined" ||
    (typeof config.condition === "string" && config.condition.trim().length === 0)
  ) {
    diagnostics.push(
      diagnostic(
        "condition-empty",
        "error",
        `${blockLabel} condition is required`,
        "Set a boolean condition before this block can be compiled or executed.",
        "condition",
      ),
    );
  }
}

function validateForLoop(
  diagnostics: FoundationBlockDiagnostic[],
  config: Record<string, unknown>,
) {
  validateIdentifier(diagnostics, stringConfig(config, "indexName", "index"), "indexName", "Index name");

  const step = numberConfig(config, "step", 1);
  if (step === 0) {
    diagnostics.push(
      diagnostic(
        "step-zero",
        "error",
        "For loop step cannot be zero",
        "A zero step would make the loop never progress.",
        "step",
      ),
    );
  }
}

function validateForEachLoop(
  diagnostics: FoundationBlockDiagnostic[],
  config: Record<string, unknown>,
) {
  validateIdentifier(diagnostics, stringConfig(config, "itemName", "item"), "itemName", "Item name");
  validateIdentifier(diagnostics, stringConfig(config, "indexName", "index"), "indexName", "Index name");
}

function validateWhileLoop(
  diagnostics: FoundationBlockDiagnostic[],
  config: Record<string, unknown>,
) {
  validateIfOrWhile(diagnostics, config, "While loop");

  const maxIterations = numberConfig(config, "maxIterations", 100);
  if (!Number.isFinite(maxIterations) || maxIterations <= 0) {
    diagnostics.push(
      diagnostic(
        "max-iterations-invalid",
        "error",
        "Invalid max iterations",
        "While loops must have a positive maxIterations guard.",
        "maxIterations",
      ),
    );
  }
}

function validateCollectionLiteral(
  diagnostics: FoundationBlockDiagnostic[],
  config: Record<string, unknown>,
  field: "items" | "entries",
  label: string,
) {
  const value = config[field];

  if (typeof value === "undefined") return;

  const kind = getFoundationRuntimeValueKind(value);
  const isArray = Array.isArray(value);

  if (!isArray) {
    diagnostics.push(
      diagnostic(
        `${field}-invalid`,
        "error",
        `Invalid ${label}`,
        `${label} must be an array. Current value is ${kind}.`,
        field,
      ),
    );
  }
}

function validateCollectionGetSet(
  diagnostics: FoundationBlockDiagnostic[],
  config: Record<string, unknown>,
  requiresValue: boolean,
) {
  if (
    typeof config.key === "undefined" ||
    (typeof config.key === "string" && config.key.trim().length === 0)
  ) {
    diagnostics.push(
      diagnostic(
        "key-empty",
        "warning",
        "Key or index is empty",
        "Set a key or index, or connect one through the input port.",
        "key",
      ),
    );
  }

  if (requiresValue && typeof config.value === "undefined") {
    diagnostics.push(
      diagnostic(
        "value-empty",
        "warning",
        "Set value is empty",
        "Set a value, or connect one through the value input port.",
        "value",
      ),
    );
  }
}

function resolveValidationArgs(
  blockTypeOrInput: FoundationBlockKind | FoundationValidationInput,
  config?: Record<string, unknown>,
) {
  if (typeof blockTypeOrInput === "string") {
    return {
      blockType: blockTypeOrInput,
      config: config ?? {},
    };
  }

  return {
    blockType:
      blockTypeOrInput.blockType ?? blockTypeOrInput.type ?? blockTypeOrInput.kind,
    config: blockTypeOrInput.config ?? {},
  };
}

export function validateFoundationBlockConfig(
  blockType: FoundationBlockKind,
  config: Record<string, unknown>,
): FoundationBlockDiagnostic[];
export function validateFoundationBlockConfig(
  input: FoundationValidationInput,
): FoundationBlockDiagnostic[];
export function validateFoundationBlockConfig(
  blockTypeOrInput: FoundationBlockKind | FoundationValidationInput,
  config?: Record<string, unknown>,
): FoundationBlockDiagnostic[] {
  const args = resolveValidationArgs(blockTypeOrInput, config);
  const diagnostics: FoundationBlockDiagnostic[] = [];

  switch (args.blockType) {
    case "variable.create":
      validateVariableCreate(diagnostics, args.config);
      break;
    case "variable.assign":
      validateVariableAssign(diagnostics, args.config);
      break;
    case "constant.create":
      validateConstantCreate(diagnostics, args.config);
      break;
    case "expression.value":
      validateExpressionValue(diagnostics, args.config);
      break;
    case "function.define":
      validateFunctionDefine(diagnostics, args.config);
      break;
    case "function.call":
      validateFunctionCall(diagnostics, args.config);
      break;
    case "control.if":
      validateIfOrWhile(diagnostics, args.config, "If");
      break;
    case "loop.for":
      validateForLoop(diagnostics, args.config);
      break;
    case "loop.forEach":
      validateForEachLoop(diagnostics, args.config);
      break;
    case "loop.while":
      validateWhileLoop(diagnostics, args.config);
      break;
    case "collection.array":
    case "collection.list":
      validateCollectionLiteral(diagnostics, args.config, "items", "items");
      break;
    case "collection.dictionary":
      validateDictionaryEntries(diagnostics, args.config);
      break;
    case "collection.get":
      validateCollectionGetSet(diagnostics, args.config, false);
      break;
    case "collection.set":
      validateCollectionGetSet(diagnostics, args.config, true);
      break;
    default:
      break;
  }

  return diagnostics;
}

export function hasBlockingFoundationDiagnostics(
  diagnostics: readonly FoundationBlockDiagnostic[],
): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

export function validateFoundationBlock(
  block: CustomToolBlock,
): FoundationValidationResult {
  if (!isFoundationCustomToolBlockType(block.type)) {
    return buildFoundationValidationResult([]);
  }

  return buildFoundationValidationResult(
    validateFoundationBlockConfig(block.type, block.config),
  );
}

export function validateFoundationWorkflowBlocks({
  blocks,
}: {
  blocks: readonly CustomToolBlock[];
}): FoundationValidationResult {
  const diagnostics = blocks.flatMap((block) => {
    if (!isFoundationCustomToolBlockType(block.type)) return [];

    return validateFoundationBlockConfig(block.type, block.config);
  });

  return buildFoundationValidationResult(diagnostics);
}

