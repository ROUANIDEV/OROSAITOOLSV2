import {
  isFoundationCustomToolBlockType,
  type CustomToolBlockType,
  type CustomToolFoundationBlockType,
} from "../../domain/customToolTypes";
import { getFoundationBlockDefinition } from "./foundationBlockRegistry";
import type { FoundationDataType } from "./foundationBlockTypes";

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
  instruction: {
    op: string;
    args: Record<string, unknown>;
  };
  pseudoCode: string;
};

const knownDataTypes = new Set<FoundationDataType>([
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

function getString(
  config: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const value = config[key];
  return typeof value === "string" ? value : fallback;
}

function getNumber(
  config: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = config[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function getBoolean(
  config: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
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
  const value = getString(config, "dataType", fallback);
  return knownDataTypes.has(value as FoundationDataType) ? value : fallback;
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

function rustType(dataType: string) {
  switch (dataType) {
    case "string":
    case "file":
    case "folder":
      return "String";
    case "number":
      return "f64";
    case "boolean":
      return "bool";
    case "array":
    case "list":
      return "Vec<serde_json::Value>";
    case "dictionary":
    case "object":
    case "json":
    case "unknown":
    default:
      return "serde_json::Value";
  }
}

function parseJsonString(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function typedLiteral(
  value: unknown,
  dataType: string,
): { literal: string; diagnostic?: string } {
  switch (dataType) {
    case "number": {
      if (typeof value === "number" && Number.isFinite(value)) {
        return { literal: String(value) };
      }

      if (typeof value === "string") {
        const trimmed = value.trim();
        const parsed = Number(trimmed);

        if (trimmed.length > 0 && Number.isFinite(parsed)) {
          return { literal: String(parsed) };
        }
      }

      return {
        literal: "/* invalid number */",
        diagnostic: `Initial value type mismatch: expected number but received ${JSON.stringify(value)}.`,
      };
    }

    case "boolean": {
      if (typeof value === "boolean") return { literal: String(value) };

      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true" || normalized === "false") {
          return { literal: normalized };
        }
      }

      return {
        literal: "/* invalid boolean */",
        diagnostic: `Initial value type mismatch: expected boolean but received ${JSON.stringify(value)}.`,
      };
    }

    case "string":
    case "file":
    case "folder":
      return { literal: JSON.stringify(String(value ?? "")) };

    case "array":
    case "list": {
      const normalized =
        typeof value === "string" ? parseJsonString(value) : value;

      if (Array.isArray(normalized)) {
        return { literal: JSON.stringify(normalized) };
      }

      return {
        literal: "/* invalid array */",
        diagnostic: `Initial value type mismatch: expected array/list but received ${JSON.stringify(value)}.`,
      };
    }

    case "dictionary":
    case "object": {
      const normalized =
        typeof value === "string" ? parseJsonString(value) : value;

      if (
        normalized !== null &&
        typeof normalized === "object" &&
        !Array.isArray(normalized)
      ) {
        return { literal: JSON.stringify(normalized) };
      }

      return {
        literal: "/* invalid object */",
        diagnostic: `Initial value type mismatch: expected object/dictionary but received ${JSON.stringify(value)}.`,
      };
    }

    case "json":
    case "unknown":
    default:
      return { literal: JSON.stringify(value ?? null) };
  }
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
    instruction: {
      op: blockKind.replace(/\./g, ":"),
      args: { ...config },
    },
    pseudoCode: `${definition.title};`,
  };
}

function markReadyWhenNoDiagnostics(
  contract: FoundationBackendContract,
): FoundationBackendContract {
  return {
    ...contract,
    status:
      contract.diagnostics.length > 0 ? "needs-config" : "ready-for-rust-handler",
  };
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
      `${label} must be a valid identifier, for example myValue or runTool.`,
    );
  }
}

function createVariableContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
): FoundationBackendContract {
  const contract = createBaseContract(blockKind, config);
  const name = asName(getString(config, "name"), "value");
  const scope = asName(getString(config, "scope"), "local");
  const dataType = getDataType(config);
  const initialValue = hasOwn(config, "initialValue") ? config.initialValue : null;
  const mutable = getBoolean(config, "mutable", true);
  const literal = typedLiteral(initialValue, dataType);

  contract.displayName = `${scope}.${name}`;
  contract.writes = [name];
  contract.instruction = {
    op: "declare_variable",
    args: {
      name,
      scope,
      dataType,
      initialValue,
      mutable,
    },
  };

  validateIdentifier(contract, name, "Variable name");

  if (literal.diagnostic) {
    contract.diagnostics.push(literal.diagnostic);
    contract.pseudoCode = `// Cannot compile variable ${name}: ${literal.diagnostic}`;
  } else {
    contract.pseudoCode = `${mutable ? "let mut" : "let"} ${name}: ${rustType(
      dataType,
    )} = ${literal.literal};`;
  }

  return markReadyWhenNoDiagnostics(contract);
}

function createAssignContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
): FoundationBackendContract {
  const contract = createBaseContract(blockKind, config);
  const name = asName(getString(config, "name"), "value");
  const expression = getString(config, "expression");

  contract.displayName = name;
  contract.reads = expression ? [expression] : [];
  contract.writes = [name];
  contract.instruction = {
    op: "assign_variable",
    args: { name, expression },
  };
  contract.pseudoCode = `${name} = ${expression || "<value>"};`;

  validateIdentifier(contract, name, "Variable name");

  if (!expression.trim()) {
    contract.diagnostics.push("Assignment expression is empty.");
  }

  return markReadyWhenNoDiagnostics(contract);
}

function createConstantContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
): FoundationBackendContract {
  const contract = createBaseContract(blockKind, config);
  const name = asName(getString(config, "name"), "CONST_VALUE");
  const dataType = getDataType(config, "string");
  const value = hasOwn(config, "value") ? config.value : "";
  const literal = typedLiteral(value, dataType);

  contract.displayName = name;
  contract.writes = [name];
  contract.instruction = {
    op: "declare_constant",
    args: { name, dataType, value },
  };

  validateIdentifier(contract, name, "Constant name");

  if (name !== name.toUpperCase()) {
    contract.diagnostics.push("Constant names should be uppercase for clarity.");
  }

  if (literal.diagnostic) {
    contract.diagnostics.push(literal.diagnostic.replace("Initial", "Constant"));
    contract.pseudoCode = `// Cannot compile constant ${name}: ${literal.diagnostic}`;
  } else {
    contract.pseudoCode = `const ${name}: ${rustType(dataType)} = ${literal.literal};`;
  }

  return markReadyWhenNoDiagnostics(contract);
}

function createExpressionContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
): FoundationBackendContract {
  const contract = createBaseContract(blockKind, config);
  const expression = getString(config, "expression");
  const template = getString(config, "template");
  const dataType = getDataType(config);

  if (blockKind === "expression.template") {
    contract.displayName = template ? "template" : "empty template";
    contract.instruction = {
      op: "render_template",
      args: {
        template,
        missingValueStrategy: getString(
          config,
          "missingValueStrategy",
          "empty-string",
        ),
      },
    };
    contract.pseudoCode = `render_template(${JSON.stringify(template)});`;
  } else {
    contract.displayName = expression || "expression";
    contract.instruction = {
      op: "evaluate_expression",
      args: { expression, dataType },
    };
    contract.pseudoCode = expression || "<expression>;";
  }

  if (!expression.trim() && blockKind === "expression.value") {
    contract.diagnostics.push("Expression is empty.");
  }

  if (!template.trim() && blockKind === "expression.template") {
    contract.diagnostics.push("Template is empty.");
  }

  return markReadyWhenNoDiagnostics(contract);
}

function createScopeContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
): FoundationBackendContract {
  const contract = createBaseContract(blockKind, config);
  const namespace = asName(getString(config, "namespace"), "scope");

  contract.displayName = namespace;
  contract.writes = [namespace];
  contract.instruction = {
    op: blockKind === "scope.global" ? "open_global_scope" : "open_local_scope",
    args: {
      namespace,
      inheritParent: getBoolean(config, "inheritParent", true),
      description: getString(config, "description"),
    },
  };
  contract.pseudoCode = `scope ${namespace} { ... }`;

  validateIdentifier(contract, namespace, "Scope namespace");

  return markReadyWhenNoDiagnostics(contract);
}

function createFunctionDefineContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
): FoundationBackendContract {
  const contract = createBaseContract(blockKind, config);
  const name = asName(getString(config, "name"), "run");
  const parameters = getArray(config, "parameters");
  const returnType = getDataType(config, "unknown");

  contract.displayName = `${name}()`;
  contract.writes = [name];
  contract.instruction = {
    op: "define_function",
    args: {
      name,
      parameters,
      returnType,
      bodyBlockIds: getArray(config, "bodyBlockIds"),
    },
  };
  contract.pseudoCode = `function ${name}(${parameters.length} params): ${returnType} { ... }`;

  validateIdentifier(contract, name, "Function name");

  return markReadyWhenNoDiagnostics(contract);
}

function createFunctionCallContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
): FoundationBackendContract {
  const contract = createBaseContract(blockKind, config);
  const functionName = asName(getString(config, "functionName"), "functionName");
  const args = getArray(config, "arguments");

  contract.displayName = `${functionName}()`;
  contract.reads = [functionName, ...args.map((arg) => String(arg))];
  contract.instruction = {
    op: "call_function",
    args: {
      functionName,
      arguments: args,
      awaitResult: getBoolean(config, "awaitResult", true),
    },
  };
  contract.pseudoCode = `${functionName}(${args.map(String).join(", ")});`;

  validateIdentifier(contract, functionName, "Function call name");

  return markReadyWhenNoDiagnostics(contract);
}

function createControlContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
): FoundationBackendContract {
  const contract = createBaseContract(blockKind, config);

  if (blockKind === "control.if") {
    const condition = getString(config, "condition");
    contract.displayName = condition || "if";
    contract.reads = condition ? [condition] : [];
    contract.instruction = {
      op: "branch_if",
      args: {
        condition,
        falseBranchEnabled: getBoolean(config, "falseBranchEnabled", true),
      },
    };
    contract.pseudoCode = `if (${condition || "<condition>"}) { ... } else { ... }`;

    if (!condition.trim()) {
      contract.diagnostics.push("Condition is empty.");
    }
  } else {
    const expression = getString(config, "expression");
    const cases = getArray(config, "cases");
    contract.displayName = expression || "switch";
    contract.reads = expression ? [expression] : [];
    contract.instruction = {
      op: "branch_switch",
      args: {
        expression,
        cases,
        defaultCaseEnabled: getBoolean(config, "defaultCaseEnabled", true),
      },
    };
    contract.pseudoCode = `switch (${expression || "<value>"}) { ${cases.length} cases }`;

    if (!expression.trim()) {
      contract.diagnostics.push("Switch expression is empty.");
    }
  }

  return markReadyWhenNoDiagnostics(contract);
}

function createLoopContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
): FoundationBackendContract {
  const contract = createBaseContract(blockKind, config);

  if (blockKind === "loop.for") {
    const indexName = asName(getString(config, "indexName"), "index");
    const start = getNumber(config, "start", 0);
    const end = getNumber(config, "end", 10);
    const step = getNumber(config, "step", 1);

    contract.displayName = `${indexName}: ${start}..${end}`;
    contract.writes = [indexName];
    contract.instruction = {
      op: "loop_for",
      args: {
        indexName,
        start,
        end,
        step,
        bodyBlockIds: getArray(config, "bodyBlockIds"),
      },
    };
    contract.pseudoCode = `for (${indexName} = ${start}; ${indexName} < ${end}; ${indexName} += ${step}) { ... }`;

    validateIdentifier(contract, indexName, "Loop index name");

    if (step === 0) {
      contract.diagnostics.push("For loop step cannot be 0.");
    }
  }

  if (blockKind === "loop.forEach") {
    const itemName = asName(getString(config, "itemName"), "item");
    const indexName = asName(getString(config, "indexName"), "index");

    contract.displayName = `${itemName} in items`;
    contract.writes = [itemName, indexName];
    contract.instruction = {
      op: "loop_for_each",
      args: {
        itemName,
        indexName,
        bodyBlockIds: getArray(config, "bodyBlockIds"),
      },
    };
    contract.pseudoCode = `for (${itemName} of items) { ... }`;

    validateIdentifier(contract, itemName, "Loop item name");
    validateIdentifier(contract, indexName, "Loop index name");
  }

  if (blockKind === "loop.while") {
    const condition = getString(config, "condition");
    const maxIterations = getNumber(config, "maxIterations", 100);

    contract.displayName = condition || "while";
    contract.reads = condition ? [condition] : [];
    contract.instruction = {
      op: "loop_while",
      args: {
        condition,
        maxIterations,
        bodyBlockIds: getArray(config, "bodyBlockIds"),
      },
    };
    contract.pseudoCode = `while (${condition || "<condition>"}) { ... }`;

    if (!condition.trim()) {
      contract.diagnostics.push("While condition is empty.");
    }

    if (maxIterations < 1) {
      contract.diagnostics.push("Max iterations must be at least 1.");
    }
  }

  return markReadyWhenNoDiagnostics(contract);
}

function createCollectionContract(
  blockKind: CustomToolFoundationBlockType,
  config: Record<string, unknown>,
): FoundationBackendContract {
  const contract = createBaseContract(blockKind, config);

  if (blockKind === "collection.array") {
    const items = getArray(config, "items");
    contract.displayName = `array[${items.length}]`;
    contract.instruction = {
      op: "create_array",
      args: {
        itemType: getString(config, "itemType", "unknown"),
        items,
      },
    };
    contract.pseudoCode = `[${items.length} items]`;
  }

  if (blockKind === "collection.list") {
    const items = getArray(config, "items");
    contract.displayName = `list[${items.length}]`;
    contract.instruction = {
      op: "create_list",
      args: {
        itemType: getString(config, "itemType", "unknown"),
        items,
        mutable: getBoolean(config, "mutable", true),
      },
    };
    contract.pseudoCode = `list(${items.length} items)`;
  }

  if (blockKind === "collection.dictionary") {
    const entries = getArray(config, "entries");
    contract.displayName = `dict{${entries.length}}`;
    contract.instruction = {
      op: "create_dictionary",
      args: {
        keyType: getString(config, "keyType", "string"),
        valueType: getString(config, "valueType", "unknown"),
        entries,
      },
    };
    contract.pseudoCode = `dictionary(${entries.length} entries)`;
  }

  if (blockKind === "collection.get") {
    const key = hasOwn(config, "key") ? config.key : "";
    contract.displayName = `get[${String(key)}]`;
    contract.reads = [String(key)];
    contract.instruction = {
      op: "collection_get",
      args: {
        key,
        fallbackValue: hasOwn(config, "fallbackValue")
          ? config.fallbackValue
          : null,
      },
    };
    contract.pseudoCode = `collection[${JSON.stringify(key)}]`;
  }

  if (blockKind === "collection.set") {
    const key = hasOwn(config, "key") ? config.key : "";
    const value = hasOwn(config, "value") ? config.value : null;
    contract.displayName = `set[${String(key)}]`;
    contract.reads = [String(key)];
    contract.writes = ["collection"];
    contract.instruction = {
      op: "collection_set",
      args: {
        key,
        value,
        immutableUpdate: getBoolean(config, "immutableUpdate", true),
      },
    };
    contract.pseudoCode = `collection[${JSON.stringify(key)}] = ${JSON.stringify(value)};`;
  }

  return markReadyWhenNoDiagnostics(contract);
}

export function createFoundationBackendContract(
  blockType: CustomToolBlockType,
  config: Record<string, unknown>,
): FoundationBackendContract | null {
  if (!isFoundationCustomToolBlockType(blockType)) return null;

  switch (blockType) {
    case "variable.create":
      return createVariableContract(blockType, config);
    case "variable.assign":
      return createAssignContract(blockType, config);
    case "constant.create":
      return createConstantContract(blockType, config);
    case "expression.value":
    case "expression.template":
      return createExpressionContract(blockType, config);
    case "scope.global":
    case "scope.local":
      return createScopeContract(blockType, config);
    case "function.define":
      return createFunctionDefineContract(blockType, config);
    case "function.call":
      return createFunctionCallContract(blockType, config);
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
      return createCollectionContract(blockType, config);
    default:
      return createBaseContract(blockType, config);
  }
}
