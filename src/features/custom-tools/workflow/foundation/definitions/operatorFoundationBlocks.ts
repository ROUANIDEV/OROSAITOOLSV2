import { foundationInput, foundationOutput } from "../foundationBlockPorts";
import type { FoundationBlockDefinition } from "../foundationBlockTypes";
import { getFoundationVisualToken } from "../foundationVisualTokens";

export const operatorFoundationBlockDefinitions = [
  {
    kind: "math.operation",
    title: "Math operation",
    category: "math",
    summary: "Combine two number values with a selected math operator.",
    description:
      "Use arrows to connect a left number and a right number, then choose add, subtract, multiply, divide, modulo, or power.",
    defaultLabel: "Math operation",
    tags: ["math", "number", "operator", "multiply", "add"],
    visual: getFoundationVisualToken("math"),
    inputs: [
      foundationInput("left", "Left", {
        dataType: "number",
        required: true,
        description: "First number input.",
      }),
      foundationInput("right", "Right", {
        dataType: "number",
        required: true,
        description: "Second number input.",
      }),
    ],
    outputs: [
      foundationOutput("result", "Result", {
        dataType: "number",
        description: "The computed number result.",
      }),
    ],
    defaultConfig: {
      resultName: "",
      operator: "multiply",
      left: "",
      right: "",
    },
  },
  {
    kind: "logic.compare",
    title: "Compare",
    category: "logic",
    summary: "Compare two values and produce true or false.",
    description:
      "Use arrows to connect left and right values, then choose equals, not equals, greater than, less than, and related operators.",
    defaultLabel: "Compare",
    tags: ["logic", "compare", "condition", "boolean"],
    visual: getFoundationVisualToken("logic"),
    inputs: [
      foundationInput("left", "Left", {
        dataType: "unknown",
        required: true,
        description: "First value to compare.",
      }),
      foundationInput("right", "Right", {
        dataType: "unknown",
        required: true,
        description: "Second value to compare.",
      }),
    ],
    outputs: [
      foundationOutput("result", "Result", {
        dataType: "boolean",
        description: "True or false comparison result.",
      }),
    ],
    defaultConfig: {
      resultName: "",
      operator: "equals",
      left: "",
      right: "",
    },
  },
] satisfies readonly FoundationBlockDefinition[];
