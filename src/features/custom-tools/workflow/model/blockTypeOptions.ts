import type { CustomToolBlockType } from "../../model/customToolTypes";

export type CustomToolBlockTypeOption = {
  value: CustomToolBlockType;
  label: string;
  description: string;
};

export const blockTypeOptions: CustomToolBlockTypeOption[] = [
  {
    value: "file.glob",
    label: "Find files",
    description: "Scan a selected folder with a glob pattern.",
  },
  {
    value: "file.read",
    label: "Read file",
    description: "Represent a file-read step in the workflow model.",
  },
  {
    value: "text.template",
    label: "Text template",
    description: "Render text from inputs and previous block outputs.",
  },
  {
    value: "python.code",
    label: "Python code",
    description: "Run Python with JSON stdin/stdout and a strict timeout.",
  },
  {
    value: "safety.preview",
    label: "Preview",
    description: "Show generated output before any real action.",
  },
  {
    value: "file.appendText",
    label: "Append text",
    description: "Append generated text after confirmation.",
  },
  {
    value: "safety.confirm",
    label: "Confirmation",
    description: "Require explicit confirmation before a real action.",
  },
];

export const customToolBlockTypeOptions = blockTypeOptions;

export function getBlockTypeLabel(type: CustomToolBlockType) {
  return blockTypeOptions.find((option) => option.value === type)?.label ?? type;
}

export function getBlockTypeDescription(type: CustomToolBlockType) {
  return (
    blockTypeOptions.find((option) => option.value === type)?.description ?? ""
  );
}