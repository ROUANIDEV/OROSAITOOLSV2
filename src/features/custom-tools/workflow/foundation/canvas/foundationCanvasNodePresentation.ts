import type {
  CustomToolBlock,
  CustomToolFoundationBlockType,
} from "../../../domain/customToolTypes";
import { getFoundationBlockDefinition } from "../foundationBlockRegistry";

export type FoundationCanvasNodeShape =
  | "ioInput"
  | "ioOutput"
  | "variable"
  | "constant"
  | "expression"
  | "math"
  | "logic"
  | "scope"
  | "function"
  | "call"
  | "condition"
  | "loop"
  | "collection";

export type FoundationCanvasNodePresentation = {
  shape: FoundationCanvasNodeShape;
  eyebrow: string;
  iconLabel: string;
  primaryText: string;
  secondaryText: string;
  detailText: string;
  chips: string[];
  shellClassName: string;
  headerClassName: string;
  iconClassName: string;
  badgeClassName: string;
  portClassName: string;
  connectorClassName: string;
};

const unknownLabel = "unnamed";

function readString(config: Record<string, unknown>, key: string, fallback = "") {
  const value = config[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function readBoolean(config: Record<string, unknown>, key: string, fallback: boolean) {
  const value = config[key];
  return typeof value === "boolean" ? value : fallback;
}

function summarizeJsonValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "undefined") return "not set";
  if (typeof value === "string") return value.length > 28 ? `${value.slice(0, 28)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "object") return `${Object.keys(value as Record<string, unknown>).length} key${Object.keys(value as Record<string, unknown>).length === 1 ? "" : "s"}`;
  return String(value);
}

function countArray(config: Record<string, unknown>, key: string) {
  const value = config[key];
  return Array.isArray(value) ? value.length : 0;
}

function createTheme(
  shellClassName: string,
  headerClassName: string,
  iconClassName: string,
  badgeClassName: string,
  portClassName: string,
  connectorClassName: string,
) {
  return {
    shellClassName,
    headerClassName,
    iconClassName,
    badgeClassName,
    portClassName,
    connectorClassName,
  };
}

const ioInputTheme = createTheme(
  "border-rose-500/60 bg-gradient-to-br from-rose-500/25 via-background to-background shadow-rose-500/20",
  "border-rose-500/30 bg-rose-500/15",
  "bg-rose-500 text-white",
  "border-rose-500/35 bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "border-rose-500 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200",
  "border-rose-500 bg-rose-500 text-white",
);

const ioOutputTheme = createTheme(
  "border-pink-500/60 bg-gradient-to-br from-pink-500/25 via-background to-background shadow-pink-500/20",
  "border-pink-500/30 bg-pink-500/15",
  "bg-pink-500 text-white",
  "border-pink-500/35 bg-pink-500/15 text-pink-700 dark:text-pink-300",
  "border-pink-500 bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-200",
  "border-pink-500 bg-pink-500 text-white",
);

const variableTheme = createTheme("border-sky-500/50 bg-gradient-to-br from-sky-500/20 via-background to-background shadow-sky-500/10", "border-sky-500/20 bg-sky-500/10", "bg-sky-500 text-white", "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300", "border-sky-500 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200", "border-sky-500 bg-sky-500 text-white");
const constantTheme = createTheme("border-amber-500/55 bg-gradient-to-br from-amber-500/20 via-background to-background shadow-amber-500/10", "border-amber-500/25 bg-amber-500/10", "bg-amber-500 text-white", "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300", "border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200", "border-amber-500 bg-amber-500 text-white");
const expressionTheme = createTheme("border-cyan-500/50 bg-gradient-to-br from-cyan-500/20 via-background to-background shadow-cyan-500/10", "border-cyan-500/20 bg-cyan-500/10", "bg-cyan-500 text-white", "border-cyan-500/30 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300", "border-cyan-500 bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200", "border-cyan-500 bg-cyan-500 text-white");
const mathTheme = createTheme("border-amber-500/60 bg-gradient-to-br from-amber-500/25 via-background to-background shadow-amber-500/20", "border-amber-500/25 bg-amber-500/15", "bg-amber-500 text-white", "border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-300", "border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200", "border-amber-500 bg-amber-500 text-white");
const logicTheme = createTheme("border-violet-500/60 bg-gradient-to-br from-violet-500/25 via-background to-background shadow-violet-500/20", "border-violet-500/25 bg-violet-500/15", "bg-violet-500 text-white", "border-violet-500/35 bg-violet-500/15 text-violet-700 dark:text-violet-300", "border-violet-500 bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200", "border-violet-500 bg-violet-500 text-white");
const scopeTheme = createTheme("border-slate-500/45 bg-gradient-to-br from-slate-500/15 via-background to-background shadow-slate-500/10", "border-slate-500/20 bg-slate-500/10", "bg-slate-600 text-white", "border-slate-500/30 bg-slate-500/15 text-slate-700 dark:text-slate-300", "border-slate-500 bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200", "border-slate-500 bg-slate-600 text-white");
const functionTheme = createTheme("border-violet-500/55 bg-gradient-to-br from-violet-500/20 via-background to-background shadow-violet-500/10", "border-violet-500/20 bg-violet-500/10", "bg-violet-500 text-white", "border-violet-500/30 bg-violet-500/15 text-violet-700 dark:text-violet-300", "border-violet-500 bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200", "border-violet-500 bg-violet-500 text-white");
const callTheme = createTheme("border-fuchsia-500/55 bg-gradient-to-br from-fuchsia-500/20 via-background to-background shadow-fuchsia-500/10", "border-fuchsia-500/20 bg-fuchsia-500/10", "bg-fuchsia-500 text-white", "border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300", "border-fuchsia-500 bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-200", "border-fuchsia-500 bg-fuchsia-500 text-white");
const conditionTheme = createTheme("border-orange-500/55 bg-gradient-to-br from-orange-500/20 via-background to-background shadow-orange-500/10", "border-orange-500/20 bg-orange-500/10", "bg-orange-500 text-white", "border-orange-500/30 bg-orange-500/15 text-orange-700 dark:text-orange-300", "border-orange-500 bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200", "border-orange-500 bg-orange-500 text-white");
const loopTheme = createTheme("border-lime-500/55 bg-gradient-to-br from-lime-500/20 via-background to-background shadow-lime-500/10", "border-lime-500/20 bg-lime-500/10", "bg-lime-600 text-white", "border-lime-500/30 bg-lime-500/15 text-lime-700 dark:text-lime-300", "border-lime-500 bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-200", "border-lime-500 bg-lime-600 text-white");
const collectionTheme = createTheme("border-emerald-500/55 bg-gradient-to-br from-emerald-500/20 via-background to-background shadow-emerald-500/10", "border-emerald-500/20 bg-emerald-500/10", "bg-emerald-500 text-white", "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", "border-emerald-500 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200", "border-emerald-500 bg-emerald-500 text-white");

function getShape(blockType: CustomToolFoundationBlockType): FoundationCanvasNodeShape {
  if (blockType === "io.input") return "ioInput";
  if (blockType === "io.output") return "ioOutput";
  if (blockType.startsWith("variable.")) return "variable";
  if (blockType === "constant.create") return "constant";
  if (blockType.startsWith("expression.")) return "expression";
  if (blockType === "math.operation") return "math";
  if (blockType === "logic.compare") return "logic";
  if (blockType.startsWith("scope.")) return "scope";
  if (blockType === "function.define") return "function";
  if (blockType === "function.call") return "call";
  if (blockType.startsWith("control.")) return "condition";
  if (blockType.startsWith("loop.")) return "loop";
  return "collection";
}

function getTheme(shape: FoundationCanvasNodeShape) {
  switch (shape) {
    case "ioInput": return ioInputTheme;
    case "ioOutput": return ioOutputTheme;
    case "variable": return variableTheme;
    case "constant": return constantTheme;
    case "expression": return expressionTheme;
    case "math": return mathTheme;
    case "logic": return logicTheme;
    case "scope": return scopeTheme;
    case "function": return functionTheme;
    case "call": return callTheme;
    case "condition": return conditionTheme;
    case "loop": return loopTheme;
    case "collection": return collectionTheme;
    default: return variableTheme;
  }
}

function getIconLabel(shape: FoundationCanvasNodeShape) {
  switch (shape) {
    case "ioInput": return "IN";
    case "ioOutput": return "OUT";
    case "variable": return "VAR";
    case "constant": return "CONST";
    case "expression": return "EXPR";
    case "math": return "MATH";
    case "logic": return "BOOL";
    case "scope": return "SCOPE";
    case "function": return "FN";
    case "call": return "CALL";
    case "condition": return "IF";
    case "loop": return "LOOP";
    case "collection": return "DATA";
    default: return "BLK";
  }
}

function getReadableExpression(config: Record<string, unknown>, key: string, fallback: string) {
  const expression = readString(config, key, fallback);
  return expression.length > 40 ? `${expression.slice(0, 40)}…` : expression;
}

function buildBlockSpecificContent(block: CustomToolBlock): Pick<FoundationCanvasNodePresentation, "primaryText" | "secondaryText" | "detailText" | "chips"> {
  const config = block.config ?? {};
  switch (block.type) {
    case "io.input": {
      const inputId = readString(config, "inputId", unknownLabel);
      const dataType = readString(config, "dataType", "unknown");
      return {
        primaryText: block.label || "Input",
        secondaryText: `${inputId} · ${dataType}`,
        detailText: readString(config, "description", "user enters this when the tool runs"),
        chips: ["input", dataType],
      };
    }
    case "io.output": {
      const outputId = readString(config, "outputId", unknownLabel);
      const dataType = readString(config, "dataType", "unknown");
      return {
        primaryText: block.label || "Output",
        secondaryText: `${outputId} · ${dataType}`,
        detailText: getReadableExpression(config, "value", "connect a value"),
        chips: ["output", dataType],
      };
    }
    case "variable.create": {
      const name = readString(config, "name", unknownLabel);
      const scope = readString(config, "scope", "local");
      const dataType = readString(config, "dataType", "unknown");
      const mutable = readBoolean(config, "mutable", true);
      return { primaryText: name, secondaryText: `${mutable ? "mutable" : "readonly"} ${dataType}`, detailText: `create in ${scope} scope`, chips: [scope, dataType, mutable ? "let" : "readonly"] };
    }
    case "variable.assign": return { primaryText: readString(config, "name", unknownLabel), secondaryText: "assign new value", detailText: getReadableExpression(config, "value", getReadableExpression(config, "expression", "connect new value")), chips: ["assign", "mutable"] };
    case "variable.update": return { primaryText: readString(config, "name", "result"), secondaryText: `${readString(config, "operation", readString(config, "operator", "add"))} by connected value`, detailText: `starts at ${summarizeJsonValue(config.initialValue)}`, chips: ["update", readString(config, "operation", readString(config, "operator", "add"))] };
    case "constant.create": return { primaryText: readString(config, "name", unknownLabel), secondaryText: `constant ${readString(config, "dataType", "unknown")}`, detailText: `value: ${summarizeJsonValue(config.value)}`, chips: ["const", readString(config, "dataType", "unknown")] };
    case "expression.value": return { primaryText: getReadableExpression(config, "expression", "expression"), secondaryText: `returns ${readString(config, "dataType", "unknown")}`, detailText: "computed value", chips: ["expr", readString(config, "dataType", "unknown")] };
    case "expression.template": return { primaryText: "template", secondaryText: getReadableExpression(config, "template", "{{value}}"), detailText: `missing values: ${readString(config, "missingValueStrategy", "empty")}`, chips: ["text", readString(config, "missingValueStrategy", "empty")] };
    case "math.operation": return { primaryText: readString(config, "resultName", "math result"), secondaryText: readString(config, "operator", "multiply"), detailText: `${summarizeJsonValue(config.left)} × ${summarizeJsonValue(config.right)}`, chips: ["math", readString(config, "operator", "multiply")] };
    case "logic.compare": return { primaryText: readString(config, "resultName", "comparison"), secondaryText: readString(config, "operator", "equals"), detailText: `${summarizeJsonValue(config.left)} ? ${summarizeJsonValue(config.right)}`, chips: ["logic", readString(config, "operator", "equals")] };
    case "scope.global": return { primaryText: readString(config, "namespace", "global"), secondaryText: "global namespace", detailText: readString(config, "description", "shared across the tool"), chips: ["global", "shared"] };
    case "scope.local": return { primaryText: readString(config, "namespace", "local"), secondaryText: "local namespace", detailText: readBoolean(config, "inheritParent", true) ? "inherits parent scope" : "isolated scope", chips: ["local", readBoolean(config, "inheritParent", true) ? "inherits" : "isolated"] };
    case "function.define": return { primaryText: `${readString(config, "name", unknownLabel)}()`, secondaryText: `${countArray(config, "parameters")} parameters`, detailText: `returns ${readString(config, "returnType", "unknown")}`, chips: ["define", `→ ${readString(config, "returnType", "unknown")}`] };
    case "function.call": return { primaryText: `${readString(config, "functionName", unknownLabel)}()`, secondaryText: `${countArray(config, "arguments")} arguments`, detailText: readString(config, "assignTo", "result not assigned"), chips: ["call", readBoolean(config, "awaitResult", true) ? "await" : "sync"] };
    case "control.if": return { primaryText: "if / else", secondaryText: getReadableExpression(config, "condition", "condition not set"), detailText: readBoolean(config, "falseBranchEnabled", true) ? "true and false branches" : "true branch only", chips: ["branch", readBoolean(config, "falseBranchEnabled", true) ? "else" : "if"] };
    case "control.switch": return { primaryText: "switch", secondaryText: getReadableExpression(config, "expression", "expression not set"), detailText: `${countArray(config, "cases")} cases`, chips: ["match", `${countArray(config, "cases")} cases`] };
    case "loop.for": return { primaryText: `for ${readString(config, "indexName", "i")}`, secondaryText: `${summarizeJsonValue(config.start)} → ${summarizeJsonValue(config.end)}`, detailText: `step ${summarizeJsonValue(config.step)}`, chips: ["for", readString(config, "indexName", "i")] };
    case "loop.forEach": return { primaryText: `for each ${readString(config, "itemName", "item")}`, secondaryText: `index: ${readString(config, "indexName", "index")}`, detailText: "iterate collection items", chips: ["foreach", readString(config, "itemName", "item")] };
    case "loop.while": return { primaryText: "while", secondaryText: getReadableExpression(config, "condition", "condition not set"), detailText: `max ${summarizeJsonValue(config.maxIterations)} iterations`, chips: ["while"] };
    case "collection.array": return { primaryText: "array", secondaryText: `${countArray(config, "items")} items`, detailText: "array literal", chips: ["array"] };
    case "collection.list": return { primaryText: "list", secondaryText: `${countArray(config, "items")} initial items`, detailText: readBoolean(config, "mutable", true) ? "mutable list" : "readonly list", chips: ["list"] };
    case "collection.dictionary": return { primaryText: "dictionary", secondaryText: summarizeJsonValue(config.entries), detailText: "key/value store", chips: ["dict"] };
    case "collection.get": return { primaryText: "get item", secondaryText: `key: ${summarizeJsonValue(config.key)}`, detailText: `from ${summarizeJsonValue(config.collection)}`, chips: ["read", "collection"] };
    case "collection.set": return { primaryText: "set item", secondaryText: `key: ${summarizeJsonValue(config.key)}`, detailText: `value ${summarizeJsonValue(config.value)}`, chips: ["write", "collection"] };
    default: return { primaryText: block.label || unknownLabel, secondaryText: block.type, detailText: block.description || "foundation model block", chips: ["model"] };
  }
}

export function getFoundationCanvasNodePresentation(block: CustomToolBlock): FoundationCanvasNodePresentation {
  const blockType = block.type as CustomToolFoundationBlockType;
  const definition = getFoundationBlockDefinition(blockType);
  const shape = getShape(blockType);
  const theme = getTheme(shape);
  const content = buildBlockSpecificContent(block);
  return {
    shape,
    eyebrow: definition.title,
    iconLabel: getIconLabel(shape),
    ...content,
    ...theme,
  };
}
