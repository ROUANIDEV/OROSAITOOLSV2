import type { FoundationBlockKind } from "../foundationBlockTypes";
import {
  checkFoundationTypedValue,
  rustLiteralForFoundationValue,
  rustTypeForFoundationDataType,
} from "../type-checking";
import { validateFoundationBlockConfig } from "../validation";

type FoundationCodePreviewInput = {
  blockType?: FoundationBlockKind;
  type?: FoundationBlockKind;
  kind?: FoundationBlockKind;
  config: Record<string, unknown>;
};

function stringConfig(
  config: Record<string, unknown>,
  key: string,
  fallback = "",
) {
  const value = config[key];
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

function dataTypeConfig(config: Record<string, unknown>) {
  const value = config.dataType;
  return typeof value === "string" && value.length > 0 ? value : "unknown";
}

function numberConfig(
  config: Record<string, unknown>,
  key: string,
  fallback: number,
) {
  const value = config[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function boolConfig(
  config: Record<string, unknown>,
  key: string,
  fallback = false,
) {
  const value = config[key];
  return typeof value === "boolean" ? value : fallback;
}

function jsonPreview(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

function invalidPreview(
  blockType: FoundationBlockKind,
  config: Record<string, unknown>,
) {
  const diagnostics = validateFoundationBlockConfig(blockType, config).filter(
    (diagnostic) => diagnostic.severity === "error",
  );

  if (diagnostics.length === 0) return null;

  return [
    "// Cannot compile this foundation block yet.",
    "// Fix these diagnostics first:",
    ...diagnostics.map(
      (diagnostic) => `// - ${diagnostic.title}: ${diagnostic.message}`,
    ),
  ].join("\n");
}

function variableCreatePreview(config: Record<string, unknown>) {
  const invalid = invalidPreview("variable.create", config);
  if (invalid) return invalid;

  const name = stringConfig(config, "name", "value");
  const dataType = dataTypeConfig(config);
  const check = checkFoundationTypedValue(dataType, config.initialValue);
  const rustType = rustTypeForFoundationDataType(dataType);
  const literal = rustLiteralForFoundationValue(dataType, config.initialValue);
  const mutable = config.mutable !== false;

  if (!check.ok) {
    return [
      `// ERROR: variable '${name}' cannot be compiled as ${dataType}.`,
      `// ${check.message}`,
    ].join("\n");
  }

  return `${mutable ? "let mut" : "let"} ${name}: ${rustType} = ${literal};`;
}

function variableAssignPreview(config: Record<string, unknown>) {
  const invalid = invalidPreview("variable.assign", config);
  if (invalid) return invalid;

  const name = stringConfig(config, "name", "value");
  const expression = config.expression ?? "/* value */";

  return `${name} = ${String(expression)};`;
}

function constantCreatePreview(config: Record<string, unknown>) {
  const invalid = invalidPreview("constant.create", config);
  if (invalid) return invalid;

  const name = stringConfig(config, "name", "CONST_VALUE");
  const dataType = dataTypeConfig(config);
  const rustType = rustTypeForFoundationDataType(dataType);
  const literal = rustLiteralForFoundationValue(dataType, config.value);

  return `let ${name}: ${rustType} = ${literal};`;
}

function expressionValuePreview(config: Record<string, unknown>) {
  const invalid = invalidPreview("expression.value", config);
  if (invalid) return invalid;

  const dataType = dataTypeConfig(config);
  const rustType = rustTypeForFoundationDataType(dataType);
  const literal = rustLiteralForFoundationValue(dataType, config.expression);

  return `let result: ${rustType} = ${literal};`;
}

function expressionTemplatePreview(config: Record<string, unknown>) {
  const template = stringConfig(config, "template", "");

  return [
    "let text = render_template(",
    `  ${JSON.stringify(template)},`,
    "  &runtime_context,",
    ");",
  ].join("\n");
}

function scopePreview(config: Record<string, unknown>, local = false) {
  const namespace = stringConfig(config, "namespace", local ? "local" : "global");

  return local
    ? `let mut ${namespace}_scope = Scope::child_of(parent_scope);`
    : `let mut ${namespace}_scope = Scope::global();`;
}

function functionDefinePreview(config: Record<string, unknown>) {
  const invalid = invalidPreview("function.define", config);
  if (invalid) return invalid;

  const name = stringConfig(config, "name", "run");
  const returnType = rustTypeForFoundationDataType(stringConfig(config, "returnType", "unknown"));
  const parameters = Array.isArray(config.parameters) ? config.parameters : [];
  const parameterPreview = parameters
    .map((parameter) => {
      if (!parameter || typeof parameter !== "object" || Array.isArray(parameter)) {
        return "/* invalid_parameter */";
      }

      const parameterConfig = parameter as Record<string, unknown>;
      const parameterName = stringConfig(parameterConfig, "name", "arg");
      const parameterType = rustTypeForFoundationDataType(
        stringConfig(parameterConfig, "dataType", "unknown"),
      );

      return `${parameterName}: ${parameterType}`;
    })
    .join(", ");

  return [`fn ${name}(${parameterPreview}) -> ${returnType} {`, "  // function body blocks", "}"].join("\n");
}

function functionCallPreview(config: Record<string, unknown>) {
  const invalid = invalidPreview("function.call", config);
  if (invalid) return invalid;

  const name = stringConfig(config, "functionName", "run");
  const args = Array.isArray(config.arguments)
    ? config.arguments.map((argument) => String(argument)).join(", ")
    : "";

  return boolConfig(config, "awaitResult", true)
    ? `let result = ${name}(${args});`
    : `${name}(${args});`;
}

function ifPreview(config: Record<string, unknown>) {
  const invalid = invalidPreview("control.if", config);
  if (invalid) return invalid;

  const condition = stringConfig(config, "condition", "condition");

  return [
    `if ${condition} {`,
    "  // true branch blocks",
    boolConfig(config, "falseBranchEnabled", true) ? "} else {" : "}",
    boolConfig(config, "falseBranchEnabled", true) ? "  // false branch blocks" : "",
    boolConfig(config, "falseBranchEnabled", true) ? "}" : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function switchPreview(config: Record<string, unknown>) {
  const value = stringConfig(config, "expression", "value");

  return [
    `match ${value} {`,
    "  // configured cases",
    boolConfig(config, "defaultCaseEnabled", true) ? "  _ => { /* default */ }" : "",
    "}",
  ]
    .filter(Boolean)
    .join("\n");
}

function forLoopPreview(config: Record<string, unknown>) {
  const invalid = invalidPreview("loop.for", config);
  if (invalid) return invalid;

  const indexName = stringConfig(config, "indexName", "index");
  const start = numberConfig(config, "start", 0);
  const end = numberConfig(config, "end", 10);
  const step = numberConfig(config, "step", 1);

  return [`for ${indexName} in (${start}..${end}).step_by(${Math.abs(step)}) {`, "  // loop body blocks", "}"].join("\n");
}

function forEachPreview(config: Record<string, unknown>) {
  const invalid = invalidPreview("loop.forEach", config);
  if (invalid) return invalid;

  const itemName = stringConfig(config, "itemName", "item");
  const indexName = stringConfig(config, "indexName", "index");

  return [`for (${indexName}, ${itemName}) in items.iter().enumerate() {`, "  // loop body blocks", "}"].join("\n");
}

function whilePreview(config: Record<string, unknown>) {
  const invalid = invalidPreview("loop.while", config);
  if (invalid) return invalid;

  const condition = stringConfig(config, "condition", "condition");
  const maxIterations = numberConfig(config, "maxIterations", 100);

  return [
    `let mut guard = 0;`,
    `while ${condition} && guard < ${maxIterations} {`,
    "  guard += 1;",
    "  // loop body blocks",
    "}",
  ].join("\n");
}

function collectionArrayPreview(config: Record<string, unknown>, list = false) {
  const invalid = invalidPreview(list ? "collection.list" : "collection.array", config);
  if (invalid) return invalid;

  return `let ${list ? "list" : "array"} = serde_json::json!(${jsonPreview(
    Array.isArray(config.items) ? config.items : [],
  )});`;
}

function dictionaryPreview(config: Record<string, unknown>) {
  const invalid = invalidPreview("collection.dictionary", config);
  if (invalid) return invalid;

  return `let dictionary = serde_json::json!(${jsonPreview(
    Array.isArray(config.entries) ? config.entries : [],
  )});`;
}

function collectionGetPreview(config: Record<string, unknown>) {
  const invalid = invalidPreview("collection.get", config);
  if (invalid) return invalid;

  return `let value = collection.get(${JSON.stringify(config.key ?? "key")});`;
}

function collectionSetPreview(config: Record<string, unknown>) {
  const invalid = invalidPreview("collection.set", config);
  if (invalid) return invalid;

  return `collection.set(${JSON.stringify(config.key ?? "key")}, serde_json::json!(${jsonPreview(
    config.value ?? null,
  )}));`;
}

function resolvePreviewArgs(
  blockTypeOrInput: FoundationBlockKind | FoundationCodePreviewInput,
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

export function getFoundationBlockCodePreview(
  blockType: FoundationBlockKind,
  config: Record<string, unknown>,
): string;
export function getFoundationBlockCodePreview(
  input: FoundationCodePreviewInput,
): string;
export function getFoundationBlockCodePreview(
  blockTypeOrInput: FoundationBlockKind | FoundationCodePreviewInput,
  config?: Record<string, unknown>,
): string {
  const args = resolvePreviewArgs(blockTypeOrInput, config);

  switch (args.blockType) {
    case "variable.create":
      return variableCreatePreview(args.config);
    case "variable.assign":
      return variableAssignPreview(args.config);
    case "constant.create":
      return constantCreatePreview(args.config);
    case "expression.value":
      return expressionValuePreview(args.config);
    case "expression.template":
      return expressionTemplatePreview(args.config);
    case "scope.global":
      return scopePreview(args.config, false);
    case "scope.local":
      return scopePreview(args.config, true);
    case "function.define":
      return functionDefinePreview(args.config);
    case "function.call":
      return functionCallPreview(args.config);
    case "control.if":
      return ifPreview(args.config);
    case "control.switch":
      return switchPreview(args.config);
    case "loop.for":
      return forLoopPreview(args.config);
    case "loop.forEach":
      return forEachPreview(args.config);
    case "loop.while":
      return whilePreview(args.config);
    case "collection.array":
      return collectionArrayPreview(args.config, false);
    case "collection.list":
      return collectionArrayPreview(args.config, true);
    case "collection.dictionary":
      return dictionaryPreview(args.config);
    case "collection.get":
      return collectionGetPreview(args.config);
    case "collection.set":
      return collectionSetPreview(args.config);
    default:
      return "// No code preview is available for this foundation block.";
  }
}
