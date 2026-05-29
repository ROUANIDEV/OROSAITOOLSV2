import type { CustomToolBlockType } from "../../domain/customToolTypes";

const pythonStarterCode = [
  "import json",
  "import sys",
  "",
  "payload = json.load(sys.stdin)",
  "inputs = payload.get(\"inputs\", {})",
  "",
  "print(json.dumps({",
  "  \"ok\": True,",
  "  \"inputKeys\": list(inputs.keys())",
  "}))",
].join("\n");

export const defaultBlockConfigByType: Record<
  CustomToolBlockType,
  Record<string, unknown>
> = {
  "file.glob": {
    rootInput: "",
    pattern: "**/*",
  },
  "file.read": {
    fileInput: "",
  },
  "text.template": {
    template: "",
  },
  "python.code": {
    code: pythonStarterCode,
    timeoutMs: 5000,
  },
  "safety.preview": {
    title: "Preview changes",
  },
  "file.appendText": {
    targetInput: "",
  },
  "safety.confirm": {
    message: "Confirm before applying changes.",
  },
  "variable.create": {
    name: "value",
    scope: "local",
    dataType: "string",
    initialValue: "",
    mutable: true,
  },
  "variable.assign": {
    name: "value",
    expression: "",
  },
  "constant.create": {
    name: "CONST_VALUE",
    dataType: "string",
    value: "",
  },
  "expression.value": {
    expression: "",
    dataType: "unknown",
  },
  "expression.template": {
    template: "",
    missingValueStrategy: "empty-string",
  },
  "scope.global": {
    namespace: "global",
    description: "",
  },
  "scope.local": {
    namespace: "local",
    inheritParent: true,
    description: "",
  },
  "function.define": {
    name: "run",
    parameters: [],
    returnType: "unknown",
    bodyBlockIds: [],
  },
  "function.call": {
    functionName: "run",
    arguments: [],
    awaitResult: true,
  },
  "control.if": {
    condition: "",
    trueBodyBlockIds: [],
    falseBodyBlockIds: [],
    falseBranchEnabled: true,
  },
  "control.switch": {
    expression: "",
    cases: [],
    defaultBodyBlockIds: [],
    defaultCaseEnabled: true,
  },
  "loop.for": {
    indexName: "index",
    start: 0,
    end: 10,
    step: 1,
    bodyBlockIds: [],
  },
  "loop.forEach": {
    itemName: "item",
    indexName: "index",
    items: [],
    bodyBlockIds: [],
  },
  "loop.while": {
    condition: "",
    maxIterations: 100,
    bodyBlockIds: [],
  },
  "collection.array": {
    outputName: "numbers",
    itemType: "number",
    items: [5, 1, 4, 2, 3],
  },
  "collection.list": {
    outputName: "items",
    itemType: "unknown",
    items: [],
    mutable: true,
  },
  "collection.dictionary": {
    outputName: "dictionary",
    keyType: "string",
    valueType: "unknown",
    entries: [],
  },
  "collection.get": {
    collection: "",
    key: "",
    fallbackValue: null,
  },
  "collection.set": {
    collection: "",
    key: "",
    value: null,
    immutableUpdate: true,
  },
  "collection.sort": {
    outputName: "sortedNumbers",
    collection: "",
    mode: "number",
    direction: "asc",
    stable: true,
  },
};

export const blockConfigPresets = defaultBlockConfigByType;

export function getBlockConfigPreset(type: CustomToolBlockType) {
  return {
    ...(defaultBlockConfigByType[type] ?? {}),
  };
}

export function createBlockConfigPreset(type: CustomToolBlockType) {
  return getBlockConfigPreset(type);
}
