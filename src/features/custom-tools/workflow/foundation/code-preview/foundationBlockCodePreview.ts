import type { CustomToolBlock } from "../../../domain/customToolTypes";
import { getFoundationBlockDefinition } from "../foundationBlockRegistry";

export type FoundationBlockCodePreview = {
  title: string;
  description: string;
  languageLabel: string;
  lines: string[];
  notes: string[];
};

const unnamed = "unnamed";

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

function readBoolean(
  config: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const value = config[key];

  return typeof value === "boolean" ? value : fallback;
}

function readNumber(
  config: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = config[key];
  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function toInlineValue(value: unknown, fallback = "undefined") {
  if (value === undefined) return fallback;

  if (typeof value === "string") {
    return value.trim().length > 0 ? value.trim() : fallback;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

function toLiteral(value: unknown, fallback = "undefined") {
  if (value === undefined) return fallback;

  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

function formatParameter(parameter: unknown, index: number) {
  if (!parameter || typeof parameter !== "object" || Array.isArray(parameter)) {
    return `arg${index + 1}: unknown`;
  }

  const record = parameter as Record<string, unknown>;
  const name = readString(record, "name", `arg${index + 1}`);
  const dataType = readString(record, "dataType", "unknown");
  const required = readBoolean(record, "required", true);

  return `${name}${required ? "" : "?"}: ${dataType}`;
}

function formatArgument(argument: unknown, index: number) {
  if (typeof argument === "string" && argument.trim().length > 0) {
    return argument.trim();
  }

  return argument === undefined ? `arg${index + 1}` : toInlineValue(argument);
}

function formatCase(caseValue: unknown, index: number) {
  if (!caseValue || typeof caseValue !== "object" || Array.isArray(caseValue)) {
    return `case value_${index + 1}:`;
  }

  const record = caseValue as Record<string, unknown>;
  const value = record.value ?? `value_${index + 1}`;
  const label = readString(record, "label", toInlineValue(value));

  return `case ${label}:`;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function createPreview(
  title: string,
  description: string,
  lines: string[],
  notes: string[] = [],
): FoundationBlockCodePreview {
  return {
    title,
    description,
    languageLabel: "foundation pseudo-code",
    lines,
    notes,
  };
}

export function getFoundationBlockCodePreview(
  block: CustomToolBlock,
): FoundationBlockCodePreview {
  const definition = getFoundationBlockDefinition(block.type as never);
  const config = block.config ?? {};

  switch (block.type) {
    case "variable.create": {
      const name = readString(config, "name", unnamed);
      const dataType = readString(config, "dataType", "unknown");
      const initialValue = toInlineValue(config.initialValue, "undefined");
      const mutable = readBoolean(config, "mutable", true);
      const keyword = mutable ? "let" : "readonly";

      return createPreview(
        `Create ${name}`,
        "Compiler draft for declaring a mutable or read-only value.",
        [`${keyword} ${name}: ${dataType} = ${initialValue};`],
        [`scope: ${readString(config, "scope", "local")}`],
      );
    }

    case "variable.assign": {
      const name = readString(config, "name", unnamed);
      const expression = toInlineValue(config.expression, "undefined");

      return createPreview(
        `Assign ${name}`,
        "Compiler draft for updating an existing variable.",
        [`${name} = ${expression};`],
      );
    }

    case "constant.create": {
      const name = readString(config, "name", "CONST_VALUE");
      const dataType = readString(config, "dataType", "unknown");

      return createPreview(
        `Constant ${name}`,
        "Compiler draft for immutable configuration or shared values.",
        [`const ${name}: ${dataType} = ${toLiteral(config.value, '""')};`],
      );
    }

    case "expression.value": {
      return createPreview(
        "Value expression",
        "Compiler draft for producing a reusable expression result.",
        [`return ${toInlineValue(config.expression, "undefined")};`],
        [`result type: ${readString(config, "dataType", "unknown")}`],
      );
    }

    case "expression.template": {
      const template = readString(config, "template", "");

      return createPreview(
        "Render template",
        "Compiler draft for rendering text using workflow context.",
        [
          `const text = renderTemplate(${toLiteral(template, '""')}, context);`,
          "return text;",
        ],
        [`missing values: ${readString(config, "missingValueStrategy", "empty-string")}`],
      );
    }

    case "scope.global": {
      const namespace = readString(config, "namespace", "global");

      return createPreview(
        `Global scope ${namespace}`,
        "Compiler draft for values shared across the whole custom tool.",
        [`scope ${namespace} {`, "  // global declarations", "}"],
      );
    }

    case "scope.local": {
      const namespace = readString(config, "namespace", "local");
      const inheritParent = readBoolean(config, "inheritParent", true);

      return createPreview(
        `Local scope ${namespace}`,
        "Compiler draft for values isolated inside a function, branch, or loop.",
        [`scope ${namespace} ${inheritParent ? "inherits parent" : "isolated"} {`, "  // local declarations", "}"],
      );
    }

    case "function.define": {
      const name = readString(config, "name", "run");
      const returnType = readString(config, "returnType", "unknown");
      const parameters = asArray(config.parameters).map(formatParameter).join(", ");

      return createPreview(
        `Function ${name}`,
        "Compiler draft for a reusable user-defined workflow function.",
        [
          `function ${name}(${parameters}): ${returnType} {`,
          "  // connected body blocks will be compiled here",
          "}",
        ],
      );
    }

    case "function.call": {
      const name = readString(config, "functionName", unnamed);
      const args = asArray(config.arguments).map(formatArgument).join(", ");
      const awaitResult = readBoolean(config, "awaitResult", true);

      return createPreview(
        `Call ${name}`,
        "Compiler draft for invoking a built-in or user-defined function.",
        [`const result = ${awaitResult ? "await " : ""}${name}(${args});`],
      );
    }

    case "control.if": {
      const condition = toInlineValue(config.condition, "condition");
      const falseBranchEnabled = readBoolean(config, "falseBranchEnabled", true);

      return createPreview(
        "If / else branch",
        "Compiler draft for branching workflow execution.",
        falseBranchEnabled
          ? [`if (${condition}) {`, "  // true branch", "} else {", "  // false branch", "}"]
          : [`if (${condition}) {`, "  // true branch", "}"],
      );
    }

    case "control.switch": {
      const expression = toInlineValue(config.expression, "value");
      const cases = asArray(config.cases);
      const renderedCases = cases.length > 0
        ? cases.flatMap((item, index) => [
            `  ${formatCase(item, index)}`,
            "    break;",
          ])
        : ["  case value:", "    break;"];

      return createPreview(
        "Switch / match",
        "Compiler draft for routing execution through multiple cases.",
        [
          `switch (${expression}) {`,
          ...renderedCases,
          ...(readBoolean(config, "defaultCaseEnabled", true)
            ? ["  default:", "    break;"]
            : []),
          "}",
        ],
      );
    }

    case "loop.for": {
      const indexName = readString(config, "indexName", "index");
      const start = readNumber(config, "start", 0);
      const end = readNumber(config, "end", 10);
      const step = readNumber(config, "step", 1);

      return createPreview(
        `For loop ${indexName}`,
        "Compiler draft for index-based repetition.",
        [
          `for (${indexName} = ${start}; ${indexName} < ${end}; ${indexName} += ${step}) {`,
          "  // loop body blocks",
          "}",
        ],
      );
    }

    case "loop.forEach": {
      const itemName = readString(config, "itemName", "item");
      const indexName = readString(config, "indexName", "index");

      return createPreview(
        `For each ${itemName}`,
        "Compiler draft for iterating a collection.",
        [
          `for each (${itemName}, ${indexName}) in items {`,
          "  // loop body blocks",
          "}",
        ],
      );
    }

    case "loop.while": {
      const condition = toInlineValue(config.condition, "condition");
      const maxIterations = readNumber(config, "maxIterations", 100);

      return createPreview(
        "While loop",
        "Compiler draft for guarded condition-based repetition.",
        [
          `while (${condition}) {`,
          "  // loop body blocks",
          "}",
        ],
        [`max iterations: ${maxIterations}`],
      );
    }

    case "collection.array": {
      return createPreview(
        "Create array",
        "Compiler draft for producing an ordered array value.",
        [`const array = ${toLiteral(config.items, "[]")};`],
        [`item type: ${readString(config, "itemType", "unknown")}`],
      );
    }

    case "collection.list": {
      return createPreview(
        "Create list",
        "Compiler draft for producing a mutable or read-only list.",
        [`const list = createList(${toLiteral(config.items, "[]")});`],
        [
          `item type: ${readString(config, "itemType", "unknown")}`,
          readBoolean(config, "mutable", true) ? "mutable" : "readonly",
        ],
      );
    }

    case "collection.dictionary": {
      return createPreview(
        "Create dictionary",
        "Compiler draft for producing a key-value collection.",
        [`const dictionary = createDictionary(${toLiteral(config.entries, "[]")});`],
        [
          `key type: ${readString(config, "keyType", "string")}`,
          `value type: ${readString(config, "valueType", "unknown")}`,
        ],
      );
    }

    case "collection.get": {
      return createPreview(
        "Get collection item",
        "Compiler draft for reading an item from an array, list, or dictionary.",
        [
          `const value = collectionGet(collection, ${toLiteral(config.key, '"key"')}, ${toLiteral(config.fallbackValue, "null")});`,
        ],
      );
    }

    case "collection.set": {
      const immutableUpdate = readBoolean(config, "immutableUpdate", true);

      return createPreview(
        "Set collection item",
        "Compiler draft for writing an item into an array, list, or dictionary.",
        [
          `const updatedCollection = collectionSet(collection, ${toLiteral(config.key, '"key"')}, ${toLiteral(config.value, "null")}, { immutable: ${immutableUpdate} });`,
        ],
      );
    }

    default:
      return createPreview(
        definition.title,
        definition.summary,
        ["// No compiler preview is available for this foundation block yet."],
      );
  }
}
