import type {
  CustomToolBlockType,
  CustomToolExecutableBlockType,
} from "../../domain/customToolTypes";
import { foundationBlockDefinitions } from "../foundation";

export type CustomToolBlockTypeOption = {
  value: CustomToolBlockType;
  label: string;
  description: string;
  executionMode: "runtime" | "model";
  category: string;
};

export type CustomToolExecutableBlockTypeOption = CustomToolBlockTypeOption & {
  value: CustomToolExecutableBlockType;
  executionMode: "runtime";
};

export const executableBlockTypeOptions: CustomToolExecutableBlockTypeOption[] = [
  {
    value: "file.glob",
    label: "Find files",
    description: "Scan a selected folder with a glob pattern.",
    executionMode: "runtime",
    category: "file",
  },
  {
    value: "file.read",
    label: "Read file",
    description: "Represent a file-read step in the workflow model.",
    executionMode: "runtime",
    category: "file",
  },
  {
    value: "text.template",
    label: "Text template",
    description: "Render text from inputs and previous block outputs.",
    executionMode: "runtime",
    category: "text",
  },
  {
    value: "python.code",
    label: "Python code",
    description: "Run Python with JSON stdin/stdout and a strict timeout.",
    executionMode: "runtime",
    category: "python",
  },
  {
    value: "safety.preview",
    label: "Preview",
    description: "Show generated output before any real action.",
    executionMode: "runtime",
    category: "safety",
  },
  {
    value: "file.appendText",
    label: "Append text",
    description: "Append generated text after confirmation.",
    executionMode: "runtime",
    category: "file",
  },
  {
    value: "safety.confirm",
    label: "Confirmation",
    description: "Require explicit confirmation before a real action.",
    executionMode: "runtime",
    category: "safety",
  },
];

export const foundationBlockTypeOptions: CustomToolBlockTypeOption[] =
  foundationBlockDefinitions.map((definition) => ({
    value: definition.kind,
    label: definition.title,
    description: definition.summary,
    executionMode: "model",
    category: definition.category,
  }));

/**
 * Backward-compatible executable list.
 *
 * Older palette components import `blockTypeOptions`; newer split palettes import
 * `executableBlockTypeOptions`. Keep both names so existing local Step 1-16 files
 * do not break during hotfixes.
 */
export const blockTypeOptions: CustomToolExecutableBlockTypeOption[] =
  executableBlockTypeOptions;

export const customToolBlockTypeOptions: CustomToolBlockTypeOption[] = [
  ...executableBlockTypeOptions,
  ...foundationBlockTypeOptions,
];

export function getBlockTypeLabel(type: CustomToolBlockType) {
  return (
    customToolBlockTypeOptions.find((option) => option.value === type)?.label ??
    type
  );
}

export function getBlockTypeDescription(type: CustomToolBlockType) {
  return (
    customToolBlockTypeOptions.find((option) => option.value === type)
      ?.description ?? ""
  );
}

export function isExecutableBlockOption(
  option: CustomToolBlockTypeOption,
): option is CustomToolExecutableBlockTypeOption {
  return option.executionMode === "runtime";
}
