import { foundationInput, foundationOutput } from "../foundationBlockPorts";
import type { FoundationBlockDefinition } from "../foundationBlockTypes";
import { getFoundationVisualToken } from "../foundationVisualTokens";

export const ioFoundationBlockDefinitions = [
  {
    kind: "io.input",
    title: "Input",
    category: "io",
    summary: "Ask the user for a value when the tool runs.",
    description:
      "Canvas input block. The generated id is read-only and the visible block name is the user-facing input name.",
    defaultLabel: "Number input",
    tags: ["input", "user field", "canvas", "parameter"],
    visual: getFoundationVisualToken("io"),
    inputs: [],
    outputs: [
      foundationOutput("value", "Value", {
        dataType: "unknown",
        description: "The typed user value from this canvas input.",
      }),
    ],
    defaultConfig: {
      inputId: "",
      dataType: "number",
      required: true,
      description: "",
    },
  },
  {
    kind: "io.output",
    title: "Output",
    category: "io",
    summary: "Show a workflow result after the tool runs.",
    description:
      "Canvas output block. Connect a value into it from another block output.",
    defaultLabel: "Result",
    tags: ["output", "result", "return", "canvas"],
    visual: getFoundationVisualToken("io"),
    inputs: [
      foundationInput("value", "Value", {
        dataType: "unknown",
        required: true,
        description: "The value returned by this output.",
      }),
    ],
    outputs: [],
    defaultConfig: {
      outputId: "",
      dataType: "unknown",
      value: "",
      description: "",
    },
  },
] satisfies readonly FoundationBlockDefinition[];
