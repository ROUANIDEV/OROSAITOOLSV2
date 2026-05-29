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
      "Represents variable creation with name, type, scope, and optional initial value.",
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
      name: "value",
      scope: "local",
      dataType: "string",
      initialValue: "",
      mutable: true,
    },
  },
  {
    kind: "variable.assign",
    title: "Assign variable",
    category: "data",
    summary: "Update an existing mutable variable.",
    description:
      "Represents assigning a new expression result to an existing variable.",
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
    ],
    defaultConfig: {
      name: "value",
      expression: "",
    },
  },
  {
    kind: "constant.create",
    title: "Create constant",
    category: "data",
    summary: "Create an immutable named value.",
    description:
      "Represents a constant that cannot be reassigned after creation.",
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
    summary: "Create a literal or computed expression.",
    description:
      "Represents a reusable expression that can feed variables, conditions, function calls, or collections.",
    defaultLabel: "Expression",
    tags: ["expression", "value", "literal"],
    visual: getFoundationVisualToken("data"),
    inputs: [],
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
    description:
      "Represents a text template with placeholders like {{variableName}}.",
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