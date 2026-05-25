import type { CustomToolBlockType } from "../model/customToolTypes";

export const blockTypeOptions: Array<{
  value: CustomToolBlockType;
  label: string;
  description: string;
}> = [
  {
    value: "file.glob",
    label: "Find files",
    description: "Find files in a selected folder using a glob pattern.",
  },
  {
    value: "file.read",
    label: "Read file",
    description: "Read text content from a selected file.",
  },
  {
    value: "file.appendText",
    label: "Append text",
    description: "Append generated text to a target file.",
  },
  {
    value: "text.template",
    label: "Template text",
    description: "Generate text using input values and previous block results.",
  },
  {
    value: "safety.preview",
    label: "Preview change",
    description: "Show a preview before writing changes to files.",
  },
  {
    value: "safety.confirm",
    label: "Ask confirmation",
    description: "Require the user to confirm before continuing.",
  },
  {
    value: "python.code",
    label: "Python code",
    description: "Run controlled Python code with JSON input and output.",
  },
];

export function getBlockTypeLabel(type: CustomToolBlockType) {
  return blockTypeOptions.find((option) => option.value === type)?.label ?? type;
}