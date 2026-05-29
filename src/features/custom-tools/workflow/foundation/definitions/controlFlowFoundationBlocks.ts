import { foundationInput, foundationOutput } from "../foundationBlockPorts";
import type { FoundationBlockDefinition } from "../foundationBlockTypes";
import { getFoundationVisualToken } from "../foundationVisualTokens";

export const controlFlowFoundationBlockDefinitions = [
  {
    kind: "control.if",
    title: "If / else",
    category: "control-flow",
    summary: "Branch workflow execution using a boolean condition.",
    description:
      "Represents an if/else condition with true and false branch outputs.",
    defaultLabel: "If condition",
    tags: ["condition", "if", "else", "branch"],
    visual: getFoundationVisualToken("control-flow"),
    inputs: [
      foundationInput("condition", "Condition", {
        dataType: "boolean",
        required: true,
      }),
    ],
    outputs: [
      foundationOutput("true", "True branch", {
        role: "control",
      }),
      foundationOutput("false", "False branch", {
        role: "control",
      }),
    ],
    defaultConfig: {
      condition: "",
      falseBranchEnabled: true,
    },
  },
  {
    kind: "control.switch",
    title: "Switch / match",
    category: "control-flow",
    summary: "Route workflow execution through many condition cases.",
    description:
      "Represents switch, match, or case-based branching for multiple possible values.",
    defaultLabel: "Switch",
    tags: ["condition", "switch", "match", "cases"],
    visual: getFoundationVisualToken("control-flow"),
    inputs: [
      foundationInput("value", "Value", {
        dataType: "unknown",
        required: true,
      }),
    ],
    outputs: [
      foundationOutput("matched", "Matched case", {
        role: "control",
      }),
      foundationOutput("default", "Default case", {
        role: "control",
      }),
    ],
    defaultConfig: {
      expression: "",
      cases: [],
      defaultCaseEnabled: true,
    },
  },
  {
    kind: "loop.for",
    title: "For loop",
    category: "control-flow",
    summary: "Repeat a block range using index boundaries.",
    description:
      "Represents a classic for loop with index, start, end, and step values.",
    defaultLabel: "For loop",
    tags: ["loop", "for", "index"],
    visual: getFoundationVisualToken("control-flow"),
    inputs: [
      foundationInput("start", "Start", {
        dataType: "number",
        required: true,
      }),
      foundationInput("end", "End", {
        dataType: "number",
        required: true,
      }),
    ],
    outputs: [
      foundationOutput("iteration", "Iteration", {
        role: "control",
      }),
      foundationOutput("index", "Index", {
        dataType: "number",
      }),
    ],
    defaultConfig: {
      indexName: "index",
      start: 0,
      end: 10,
      step: 1,
      bodyBlockIds: [],
    },
  },
  {
    kind: "loop.forEach",
    title: "For each loop",
    category: "control-flow",
    summary: "Repeat a block range for every item in a collection.",
    description:
      "Represents iterating through arrays, lists, dictionaries, or file lists.",
    defaultLabel: "For each",
    tags: ["loop", "foreach", "collection"],
    visual: getFoundationVisualToken("control-flow"),
    inputs: [
      foundationInput("items", "Items", {
        dataType: "array",
        required: true,
      }),
    ],
    outputs: [
      foundationOutput("iteration", "Iteration", {
        role: "control",
      }),
      foundationOutput("item", "Item", {
        dataType: "unknown",
      }),
      foundationOutput("index", "Index", {
        dataType: "number",
      }),
    ],
    defaultConfig: {
      itemName: "item",
      indexName: "index",
      bodyBlockIds: [],
    },
  },
  {
    kind: "loop.while",
    title: "While loop",
    category: "control-flow",
    summary: "Repeat while a condition remains true.",
    description:
      "Represents condition-based repetition with a max-iteration guard.",
    defaultLabel: "While loop",
    tags: ["loop", "while", "condition"],
    visual: getFoundationVisualToken("control-flow"),
    inputs: [
      foundationInput("condition", "Condition", {
        dataType: "boolean",
        required: true,
      }),
    ],
    outputs: [
      foundationOutput("iteration", "Iteration", {
        role: "control",
      }),
      foundationOutput("completed", "Completed", {
        role: "control",
      }),
    ],
    defaultConfig: {
      condition: "",
      maxIterations: 100,
      bodyBlockIds: [],
    },
  },
] satisfies readonly FoundationBlockDefinition[];