import { foundationInput, foundationOutput } from "../foundationBlockPorts";
import type { FoundationBlockDefinition } from "../foundationBlockTypes";
import { getFoundationVisualToken } from "../foundationVisualTokens";

export const functionFoundationBlockDefinitions = [
  {
    kind: "scope.global",
    title: "Global scope",
    category: "scope",
    summary: "Declare values available across the whole tool.",
    description:
      "Represents global variables, constants, and helper definitions shared by the workflow.",
    defaultLabel: "Global scope",
    tags: ["scope", "global", "shared"],
    visual: getFoundationVisualToken("scope"),
    inputs: [],
    outputs: [
      foundationOutput("scope", "Scope", {
        role: "scope",
        dataType: "object",
      }),
    ],
    defaultConfig: {
      namespace: "global",
      description: "",
    },
  },
  {
    kind: "scope.local",
    title: "Local scope",
    category: "scope",
    summary: "Declare a scope local to a function, branch, or loop.",
    description:
      "Represents variables that should only exist inside a smaller execution context.",
    defaultLabel: "Local scope",
    tags: ["scope", "local", "context"],
    visual: getFoundationVisualToken("scope"),
    inputs: [
      foundationInput("parentScope", "Parent scope", {
        role: "scope",
        dataType: "object",
        required: false,
      }),
    ],
    outputs: [
      foundationOutput("scope", "Local scope", {
        role: "scope",
        dataType: "object",
      }),
    ],
    defaultConfig: {
      namespace: "local",
      inheritParent: true,
    },
  },
  {
    kind: "function.define",
    title: "Define function",
    category: "function",
    summary: "Create a reusable workflow function.",
    description:
      "Represents a named function with parameters, return type, and an internal block body.",
    defaultLabel: "Define function",
    tags: ["function", "definition", "reusable"],
    visual: getFoundationVisualToken("function"),
    inputs: [
      foundationInput("body", "Body", {
        role: "control",
        required: false,
      }),
    ],
    outputs: [
      foundationOutput("function", "Function ref", {
        dataType: "unknown",
      }),
      foundationOutput("return", "Return value", {
        dataType: "unknown",
      }),
    ],
    defaultConfig: {
      name: "run",
      parameters: [],
      returnType: "unknown",
      bodyBlockIds: [],
    },
  },
  {
    kind: "function.call",
    title: "Call function",
    category: "function",
    summary: "Execute a function and capture its result.",
    description:
      "Represents calling a built-in function, helper function, or user-defined function.",
    defaultLabel: "Call function",
    tags: ["function", "call", "invoke"],
    visual: getFoundationVisualToken("function"),
    inputs: [
      foundationInput("function", "Function", {
        dataType: "unknown",
        required: false,
      }),
      foundationInput("arguments", "Arguments", {
        dataType: "array",
        required: false,
      }),
    ],
    outputs: [
      foundationOutput("result", "Result", {
        dataType: "unknown",
      }),
    ],
    defaultConfig: {
      functionName: "",
      arguments: [],
      awaitResult: true,
    },
  },
] satisfies readonly FoundationBlockDefinition[];