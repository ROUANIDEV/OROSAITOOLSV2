import type {
  CustomToolBlock,
  CustomToolFoundationBlockType,
} from "../../../domain/customToolTypes";
import { getFoundationBlockDefinition } from "../foundationBlockRegistry";

export type FoundationCanvasNodeShape =
  | "variable"
  | "constant"
  | "expression"
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

function readString(
  config: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const value = config[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function readNumber(
  config: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = config[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBoolean(
  config: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const value = config[key];
  return typeof value === "boolean" ? value : fallback;
}

function countArray(config: Record<string, unknown>, key: string) {
  const value = config[key];
  return Array.isArray(value) ? value.length : 0;
}

function summarizeJsonValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "not set";
  if (typeof value === "string") return value.length > 28 ? `${value.slice(0, 28)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "object") return `${Object.keys(value).length} key${Object.keys(value).length === 1 ? "" : "s"}`;
  return String(value);
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

const variableTheme = createTheme(
  "border-sky-500/50 bg-gradient-to-br from-sky-500/20 via-background to-background shadow-sky-500/10",
  "border-sky-500/20 bg-sky-500/10",
  "bg-sky-500 text-white",
  "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "border-sky-500 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200",
  "border-sky-500 bg-sky-500 text-white",
);

const constantTheme = createTheme(
  "border-amber-500/55 bg-gradient-to-br from-amber-500/20 via-background to-background shadow-amber-500/10",
  "border-amber-500/25 bg-amber-500/10",
  "bg-amber-500 text-white",
  "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
  "border-amber-500 bg-amber-500 text-white",
);

const expressionTheme = createTheme(
  "border-cyan-500/50 bg-gradient-to-br from-cyan-500/20 via-background to-background shadow-cyan-500/10",
  "border-cyan-500/20 bg-cyan-500/10",
  "bg-cyan-500 text-white",
  "border-cyan-500/30 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  "border-cyan-500 bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200",
  "border-cyan-500 bg-cyan-500 text-white",
);

const scopeTheme = createTheme(
  "border-slate-500/45 bg-gradient-to-br from-slate-500/15 via-background to-background shadow-slate-500/10",
  "border-slate-500/20 bg-slate-500/10",
  "bg-slate-600 text-white",
  "border-slate-500/30 bg-slate-500/15 text-slate-700 dark:text-slate-300",
  "border-slate-500 bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  "border-slate-500 bg-slate-600 text-white",
);

const functionTheme = createTheme(
  "border-violet-500/55 bg-gradient-to-br from-violet-500/20 via-background to-background shadow-violet-500/10",
  "border-violet-500/20 bg-violet-500/10",
  "bg-violet-500 text-white",
  "border-violet-500/30 bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "border-violet-500 bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200",
  "border-violet-500 bg-violet-500 text-white",
);

const callTheme = createTheme(
  "border-fuchsia-500/55 bg-gradient-to-br from-fuchsia-500/20 via-background to-background shadow-fuchsia-500/10",
  "border-fuchsia-500/20 bg-fuchsia-500/10",
  "bg-fuchsia-500 text-white",
  "border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
  "border-fuchsia-500 bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-200",
  "border-fuchsia-500 bg-fuchsia-500 text-white",
);

const conditionTheme = createTheme(
  "border-orange-500/55 bg-gradient-to-br from-orange-500/20 via-background to-background shadow-orange-500/10",
  "border-orange-500/20 bg-orange-500/10",
  "bg-orange-500 text-white",
  "border-orange-500/30 bg-orange-500/15 text-orange-700 dark:text-orange-300",
  "border-orange-500 bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200",
  "border-orange-500 bg-orange-500 text-white",
);

const loopTheme = createTheme(
  "border-lime-500/55 bg-gradient-to-br from-lime-500/20 via-background to-background shadow-lime-500/10",
  "border-lime-500/20 bg-lime-500/10",
  "bg-lime-600 text-white",
  "border-lime-500/30 bg-lime-500/15 text-lime-700 dark:text-lime-300",
  "border-lime-500 bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-200",
  "border-lime-500 bg-lime-600 text-white",
);

const collectionTheme = createTheme(
  "border-emerald-500/55 bg-gradient-to-br from-emerald-500/20 via-background to-background shadow-emerald-500/10",
  "border-emerald-500/20 bg-emerald-500/10",
  "bg-emerald-500 text-white",
  "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "border-emerald-500 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  "border-emerald-500 bg-emerald-500 text-white",
);

function getShape(blockType: CustomToolFoundationBlockType): FoundationCanvasNodeShape {
  if (blockType.startsWith("variable.")) return "variable";
  if (blockType === "constant.create") return "constant";
  if (blockType.startsWith("expression.")) return "expression";
  if (blockType.startsWith("scope.")) return "scope";
  if (blockType === "function.define") return "function";
  if (blockType === "function.call") return "call";
  if (blockType.startsWith("control.")) return "condition";
  if (blockType.startsWith("loop.")) return "loop";
  return "collection";
}

function getTheme(shape: FoundationCanvasNodeShape) {
  switch (shape) {
    case "variable":
      return variableTheme;
    case "constant":
      return constantTheme;
    case "expression":
      return expressionTheme;
    case "scope":
      return scopeTheme;
    case "function":
      return functionTheme;
    case "call":
      return callTheme;
    case "condition":
      return conditionTheme;
    case "loop":
      return loopTheme;
    case "collection":
      return collectionTheme;
    default:
      return variableTheme;
  }
}

function getIconLabel(shape: FoundationCanvasNodeShape) {
  switch (shape) {
    case "variable":
      return "VAR";
    case "constant":
      return "CONST";
    case "expression":
      return "EXPR";
    case "scope":
      return "SCOPE";
    case "function":
      return "FN";
    case "call":
      return "CALL";
    case "condition":
      return "IF";
    case "loop":
      return "LOOP";
    case "collection":
      return "DATA";
    default:
      return "BLK";
  }
}

function getReadableExpression(config: Record<string, unknown>, key: string, fallback: string) {
  const expression = readString(config, key, fallback);
  return expression.length > 40 ? `${expression.slice(0, 40)}…` : expression;
}

function buildBlockSpecificContent(block: CustomToolBlock): Pick<
  FoundationCanvasNodePresentation,
  "primaryText" | "secondaryText" | "detailText" | "chips"
> {
  const config = block.config ?? {};

  switch (block.type) {
    case "variable.create": {
      const name = readString(config, "name", unknownLabel);
      const scope = readString(config, "scope", "local");
      const dataType = readString(config, "dataType", "unknown");
      const mutable = readBoolean(config, "mutable", true);

      return {
        primaryText: name,
        secondaryText: `${mutable ? "mutable" : "readonly"} ${dataType}`,
        detailText: `create in ${scope} scope`,
        chips: [scope, dataType, mutable ? "let" : "readonly"],
      };
    }

    case "variable.assign": {
      const name = readString(config, "name", unknownLabel);

      return {
        primaryText: name,
        secondaryText: "assign new value",
        detailText: getReadableExpression(config, "expression", "expression not set"),
        chips: ["assign", "mutable"],
      };
    }

    case "constant.create": {
      const name = readString(config, "name", unknownLabel);
      const dataType = readString(config, "dataType", "unknown");

      return {
        primaryText: name,
        secondaryText: `constant ${dataType}`,
        detailText: `value: ${summarizeJsonValue(config.value)}`,
        chips: ["const", dataType],
      };
    }

    case "expression.value": {
      const dataType = readString(config, "dataType", "unknown");

      return {
        primaryText: getReadableExpression(config, "expression", "expression"),
        secondaryText: `returns ${dataType}`,
        detailText: "computed value",
        chips: ["expr", dataType],
      };
    }

    case "expression.template": {
      const strategy = readString(config, "missingValueStrategy", "empty-string");

      return {
        primaryText: "template",
        secondaryText: `${readString(config, "template", "{{value}}").slice(0, 40)}${readString(config, "template", "{{value}}").length > 40 ? "…" : ""}`,
        detailText: `missing values: ${strategy}`,
        chips: ["text", strategy],
      };
    }

    case "scope.global": {
      const namespace = readString(config, "namespace", "global");

      return {
        primaryText: namespace,
        secondaryText: "global namespace",
        detailText: readString(config, "description", "shared across the tool"),
        chips: ["global", "shared"],
      };
    }

    case "scope.local": {
      const namespace = readString(config, "namespace", "local");
      const inheritParent = readBoolean(config, "inheritParent", true);

      return {
        primaryText: namespace,
        secondaryText: "local namespace",
        detailText: inheritParent ? "inherits parent scope" : "isolated scope",
        chips: ["local", inheritParent ? "inherits" : "isolated"],
      };
    }

    case "function.define": {
      const name = readString(config, "name", unknownLabel);
      const returnType = readString(config, "returnType", "unknown");
      const parameterCount = countArray(config, "parameters");

      return {
        primaryText: `${name}()` ,
        secondaryText: `${parameterCount} parameter${parameterCount === 1 ? "" : "s"}`,
        detailText: `returns ${returnType}`,
        chips: ["define", `→ ${returnType}`],
      };
    }

    case "function.call": {
      const name = readString(config, "functionName", unknownLabel);
      const argumentCount = countArray(config, "arguments");
      const awaitResult = readBoolean(config, "awaitResult", true);

      return {
        primaryText: `${name}()` ,
        secondaryText: `${argumentCount} argument${argumentCount === 1 ? "" : "s"}`,
        detailText: awaitResult ? "await result" : "fire and continue",
        chips: ["call", awaitResult ? "await" : "sync"],
      };
    }

    case "control.if": {
      return {
        primaryText: "if / else",
        secondaryText: getReadableExpression(config, "condition", "condition not set"),
        detailText: readBoolean(config, "falseBranchEnabled", true)
          ? "true and false branches"
          : "true branch only",
        chips: ["branch", readBoolean(config, "falseBranchEnabled", true) ? "else" : "if"],
      };
    }

    case "control.switch": {
      const caseCount = countArray(config, "cases");

      return {
        primaryText: "switch",
        secondaryText: getReadableExpression(config, "expression", "expression not set"),
        detailText: `${caseCount} case${caseCount === 1 ? "" : "s"}`,
        chips: ["match", `${caseCount} cases`],
      };
    }

    case "loop.for": {
      const indexName = readString(config, "indexName", "index");
      const start = readNumber(config, "start", 0);
      const end = readNumber(config, "end", 10);
      const step = readNumber(config, "step", 1);

      return {
        primaryText: `for ${indexName}`,
        secondaryText: `${start} → ${end}`,
        detailText: `step ${step}`,
        chips: ["for", indexName],
      };
    }

    case "loop.forEach": {
      const itemName = readString(config, "itemName", "item");
      const indexName = readString(config, "indexName", "index");

      return {
        primaryText: `for each ${itemName}`,
        secondaryText: `index: ${indexName}`,
        detailText: "iterate collection items",
        chips: ["foreach", itemName],
      };
    }

    case "loop.while": {
      const maxIterations = readNumber(config, "maxIterations", 100);

      return {
        primaryText: "while",
        secondaryText: getReadableExpression(config, "condition", "condition not set"),
        detailText: `max ${maxIterations} iterations`,
        chips: ["while", `max ${maxIterations}`],
      };
    }

    case "collection.array": {
      const itemType = readString(config, "itemType", "unknown");
      const itemCount = countArray(config, "items");

      return {
        primaryText: "array",
        secondaryText: `${itemCount} item${itemCount === 1 ? "" : "s"}`,
        detailText: `item type: ${itemType}`,
        chips: ["array", itemType],
      };
    }

    case "collection.list": {
      const itemType = readString(config, "itemType", "unknown");
      const itemCount = countArray(config, "items");

      return {
        primaryText: "list",
        secondaryText: `${itemCount} initial item${itemCount === 1 ? "" : "s"}`,
        detailText: readBoolean(config, "mutable", true) ? "mutable list" : "readonly list",
        chips: ["list", itemType],
      };
    }

    case "collection.dictionary": {
      const keyType = readString(config, "keyType", "string");
      const valueType = readString(config, "valueType", "unknown");
      const entryCount = countArray(config, "entries");

      return {
        primaryText: "dictionary",
        secondaryText: `${entryCount} entr${entryCount === 1 ? "y" : "ies"}`,
        detailText: `${keyType} → ${valueType}`,
        chips: ["dict", valueType],
      };
    }

    case "collection.get": {
      return {
        primaryText: "get item",
        secondaryText: `key: ${summarizeJsonValue(config.key)}`,
        detailText: `fallback: ${summarizeJsonValue(config.fallbackValue)}`,
        chips: ["read", "collection"],
      };
    }

    case "collection.set": {
      return {
        primaryText: "set item",
        secondaryText: `key: ${summarizeJsonValue(config.key)}`,
        detailText: readBoolean(config, "immutableUpdate", true)
          ? "immutable update"
          : "mutate collection",
        chips: ["write", readBoolean(config, "immutableUpdate", true) ? "immutable" : "mutate"],
      };
    }

    default:
      return {
        primaryText: block.label || unknownLabel,
        secondaryText: block.type,
        detailText: block.description || "foundation model block",
        chips: ["model"],
      };
  }
}

export function getFoundationCanvasNodePresentation(
  block: CustomToolBlock,
): FoundationCanvasNodePresentation {
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
