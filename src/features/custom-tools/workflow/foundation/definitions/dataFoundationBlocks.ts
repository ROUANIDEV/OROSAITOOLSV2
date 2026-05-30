import { foundationInput, foundationOutput } from "../foundationBlockPorts";
import type { FoundationBlockDefinition } from "../foundationBlockTypes";
import { getFoundationVisualToken } from "../foundationVisualTokens";

export const dataFoundationBlockDefinitions = [
  {
    kind: "variable.create",
    title: "Create variable",
    category: "data",
    summary: "Create a mutable value in the selected scope.",
    description:
      "Creates a named value that other blocks can read by connecting the Variable ref output or by choosing the variable name from canvas values.",
    defaultLabel: "Create variable",
    tags: ["variable", "mutable", "state"],
    visual: getFoundationVisualToken("data"),
    inputs: [
      foundationInput("initialValue", "Initial value", {
        dataType: "unknown",
        required: false,
      }),
    ],
    outputs: [
      foundationOutput("value", "Value", {
        dataType: "unknown",
      }),
      foundationOutput("reference", "Variable ref", {
        dataType: "unknown",
      }),
    ],
    defaultConfig: {
      name: "result",
      scope: "local",
      dataType: "number",
      initialValue: 1,
      mutable: true,
    },
  },
  {
    kind: "variable.assign",
    title: "Assign variable",
    category: "data",
    summary: "Update an existing mutable variable.",
    description:
      "Updates a variable using a value connected from another block. Use Math operation and Compare blocks instead of typing code expressions.",
    defaultLabel: "Assign variable",
    tags: ["variable", "assign", "mutation"],
    visual: getFoundationVisualToken("data"),
    inputs: [
      foundationInput("value", "New value", {
        dataType: "unknown",
        required: true,
      }),
    ],
    outputs: [
      foundationOutput("assignedValue", "Assigned value", {
        dataType: "unknown",
      }),
      foundationOutput("reference", "Variable ref", {
        dataType: "unknown",
      }),
    ],
    defaultConfig: {
      name: "result",
      value: "",
    },
  },
  {
    kind: "variable.update",
    title: "Update variable",
    category: "data",
    summary: "Update a stored value with one connected value.",
    description:
      "Keeps one named value and updates it with add, subtract, multiply, divide, modulo, or power. This is easier than separate create variable, math operation, and assign variable blocks for counters and running totals.",
    defaultLabel: "Update variable",
    tags: ["variable", "update", "counter", "accumulator", "running total"],
    visual: getFoundationVisualToken("data"),
    inputs: [
      foundationInput("operand", "Value to use", {
        dataType: "number",
        required: true,
        description: "The value used to update the stored variable. For factorial, connect the loop index here.",
      }),
    ],
    outputs: [
      foundationOutput("value", "Updated value", {
        dataType: "number",
        description: "The new stored value after the update.",
      }),
      foundationOutput("reference", "Variable ref", {
        dataType: "number",
        description: "The variable name that can feed an Output block.",
      }),
    ],
    defaultConfig: {
      name: "result",
      dataType: "number",
      initialValue: 1,
      operation: "multiply",
      operand: "",
    },
  },
  {
    kind: "constant.create",
    title: "Create constant",
    category: "data",
    summary: "Create an immutable named value.",
    description: "Represents a constant that cannot be reassigned after creation.",
    defaultLabel: "Create constant",
    tags: ["constant", "immutable", "config"],
    visual: getFoundationVisualToken("data"),
    inputs: [
      foundationInput("value", "Value", {
        dataType: "unknown",
        required: true,
      }),
    ],
    outputs: [
      foundationOutput("constant", "Constant", {
        dataType: "unknown",
      }),
      foundationOutput("reference", "Constant ref", {
        dataType: "unknown",
      }),
    ],
    defaultConfig: {
      name: "CONST_VALUE",
      dataType: "string",
      value: "",
    },
  },
  {
    kind: "expression.value",
    title: "Value expression",
    category: "data",
    summary: "Create a literal or selected canvas value.",
    description:
      "Represents a reusable value. For operations, prefer Math operation and Compare blocks.",
    defaultLabel: "Value",
    tags: ["expression", "value", "literal"],
    visual: getFoundationVisualToken("data"),
    inputs: [
      foundationInput("value", "Value", {
        dataType: "unknown",
        required: false,
      }),
    ],
    outputs: [
      foundationOutput("result", "Result", {
        dataType: "unknown",
      }),
    ],
    defaultConfig: {
      expression: "",
      dataType: "unknown",
    },
  },
  {
    kind: "expression.template",
    title: "Template expression",
    category: "data",
    summary: "Render text from variables, inputs, and block outputs.",
    description: "Represents a text template with placeholders like {{variableName}}.",
    defaultLabel: "Template",
    tags: ["expression", "template", "text"],
    visual: getFoundationVisualToken("data"),
    inputs: [
      foundationInput("context", "Context", {
        dataType: "json",
        required: false,
      }),
    ],
    outputs: [
      foundationOutput("text", "Text", {
        dataType: "string",
      }),
    ],
    defaultConfig: {
      template: "",
      missingValueStrategy: "empty-string",
    },
  },
] satisfies readonly FoundationBlockDefinition[];
