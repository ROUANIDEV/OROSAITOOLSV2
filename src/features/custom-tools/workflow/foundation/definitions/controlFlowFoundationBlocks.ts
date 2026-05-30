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
      "Represents an if/else condition with true and false branch outputs. The condition can use variables, input ids, or expressions such as n > 1.",
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
      foundationOutput("true", "True branch", { role: "control" }),
      foundationOutput("false", "False branch", { role: "control" }),
    ],
    defaultConfig: {
      condition: "",
      trueBodyBlockIds: [],
      falseBodyBlockIds: [],
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
      foundationOutput("matched", "Matched case", { role: "control" }),
      foundationOutput("default", "Default case", { role: "control" }),
    ],
    defaultConfig: {
      expression: "",
      cases: [],
      defaultBodyBlockIds: [],
      defaultCaseEnabled: true,
    },
  },
  {
    kind: "loop.for",
    title: "For loop",
    category: "control-flow",
    summary: "Repeat body blocks using index boundaries.",
    description:
      "Start, end, and step are expression fields, not number-only fields. They can be hardcoded numbers, variables, canvas input ids such as n, or tokens such as {{n}}.",
    defaultLabel: "For loop",
    tags: ["loop", "for", "index"],
    visual: getFoundationVisualToken("control-flow"),
    inputs: [
      foundationInput("start", "Start", {
        dataType: "number",
        required: true,
        description: "Number, variable, or connected input value.",
      }),
      foundationInput("end", "End", {
        dataType: "number",
        required: true,
        description: "Number, variable, or connected input value.",
      }),
      foundationInput("step", "Step", {
        dataType: "number",
        required: false,
      }),
      foundationInput("body", "Body blocks", {
        role: "control",
        required: false,
        description:
          "Connect the iteration/body output to the first block that should run inside the loop.",
      }),
    ],
    outputs: [
      foundationOutput("iteration", "Iteration / body", { role: "control" }),
      foundationOutput("completed", "Completed", { role: "control" }),
      foundationOutput("index", "Index", { dataType: "number" }),
    ],
    defaultConfig: {
      indexName: "i",
      start: "2",
      end: "n",
      step: "1",
      inclusiveEnd: true,
      bodyBlockIds: [],
    },
  },
  {
    kind: "loop.forEach",
    title: "For each loop",
    category: "control-flow",
    summary: "Repeat body blocks for every item in a collection.",
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
      foundationInput("body", "Body blocks", {
        role: "control",
        required: false,
      }),
    ],
    outputs: [
      foundationOutput("iteration", "Iteration / body", { role: "control" }),
      foundationOutput("completed", "Completed", { role: "control" }),
      foundationOutput("item", "Item", { dataType: "unknown" }),
      foundationOutput("index", "Index", { dataType: "number" }),
    ],
    defaultConfig: {
      itemName: "item",
      indexName: "index",
      items: [],
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
      foundationInput("body", "Body blocks", {
        role: "control",
        required: false,
      }),
    ],
    outputs: [
      foundationOutput("iteration", "Iteration / body", { role: "control" }),
      foundationOutput("completed", "Completed", { role: "control" }),
    ],
    defaultConfig: {
      condition: "",
      maxIterations: "100",
      bodyBlockIds: [],
    },
  },
] satisfies readonly FoundationBlockDefinition[];
