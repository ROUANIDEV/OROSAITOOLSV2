import type { CustomToolBlockType } from "../../domain/customToolTypes";

export type CustomToolBlockConfigPreset = Record<string, unknown>;

export const blockConfigPresets: Record<string, CustomToolBlockConfigPreset> = {
  "io.input": {
    inputId: "",
    dataType: "number",
    required: true,
    description: "",
  },
  "io.output": {
    outputId: "",
    dataType: "unknown",
    value: "",
    description: "",
  },
  "variable.create": {
    name: "result",
    scope: "local",
    dataType: "number",
    mutable: true,
    initialValue: 1,
  },
  "variable.assign": {
    name: "result",
    value: "",
  },
  "constant.create": {
    name: "CONSTANT",
    dataType: "string",
    value: "",
  },
  "expression.value": {
    dataType: "unknown",
    expression: "",
  },
  "expression.template": {
    template: "",
    missingValueStrategy: "empty",
  },
  "math.operation": {
    resultName: "",
    operator: "multiply",
    left: "",
    right: "",
  },
  "logic.compare": {
    resultName: "",
    operator: "equals",
    left: "",
    right: "",
  },
  "scope.global": {
    namespace: "global",
    description: "",
  },
  "scope.local": {
    namespace: "local",
    inheritParent: true,
  },
  "function.define": {
    name: "factorial",
    parameters: ["n"],
    returnType: "number",
    bodyBlockIds: [],
    returnExpression: "result",
  },
  "function.call": {
    functionName: "factorial",
    arguments: [],
    assignTo: "factorialResult",
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
    indexName: "i",
    start: 2,
    end: "",
    step: 1,
    inclusiveEnd: true,
    bodyBlockIds: [],
  },
  "loop.forEach": {
    itemName: "item",
    indexName: "index",
    items: "",
    bodyBlockIds: [],
  },
  "loop.while": {
    condition: "",
    maxIterations: 100,
    bodyBlockIds: [],
  },
  "collection.array": {
    items: [],
  },
  "collection.list": {
    items: [],
  },
  "collection.dictionary": {
    entries: {},
  },
  "collection.get": {
    collection: "",
    key: "",
  },
  "collection.set": {
    collection: "",
    key: "",
    value: "",
  },
  "collection.sort": {
    collection: "",
    direction: "asc",
  },
  "python.code": {
    code: "",
  },
};

export function createBlockConfigPreset(
  type: CustomToolBlockType | string,
): CustomToolBlockConfigPreset {
  const preset = blockConfigPresets[String(type)] ?? {};
  return JSON.parse(JSON.stringify(preset)) as CustomToolBlockConfigPreset;
}
