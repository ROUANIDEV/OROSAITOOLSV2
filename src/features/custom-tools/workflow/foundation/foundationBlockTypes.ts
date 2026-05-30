import {
  customToolFoundationBlockTypes,
  type CustomToolFoundationBlockType,
} from "../../domain/customToolTypes";

export const foundationBlockCategories = [
  "io",
  "data",
  "math",
  "logic",
  "scope",
  "function",
  "control-flow",
  "collection",
] as const;

export type FoundationBlockCategory =
  (typeof foundationBlockCategories)[number];

export const foundationDataTypes = [
  "string",
  "number",
  "boolean",
  "json",
  "array",
  "list",
  "dictionary",
  "object",
  "file",
  "folder",
  "void",
  "unknown",
] as const;

export type FoundationDataType = (typeof foundationDataTypes)[number];

export const foundationBlockKinds = customToolFoundationBlockTypes;
export type FoundationBlockKind = CustomToolFoundationBlockType;

export type FoundationBlockPaletteTone =
  | "slate"
  | "sky"
  | "violet"
  | "emerald"
  | "amber"
  | "rose";

export type FoundationBlockPortDirection = "input" | "output";
export type FoundationBlockPortRole = "data" | "control" | "scope";

export type FoundationBlockPort = {
  id: string;
  label: string;
  direction: FoundationBlockPortDirection;
  role: FoundationBlockPortRole;
  dataType?: FoundationDataType;
  required?: boolean;
  description?: string;
};

export type FoundationBlockVisualToken = {
  tone: FoundationBlockPaletteTone;
  icon: string;
  accentClassName: string;
  surfaceClassName: string;
  borderClassName: string;
  textClassName: string;
  badgeClassName: string;
};

export type FoundationBlockDefinition = {
  kind: FoundationBlockKind;
  title: string;
  category: FoundationBlockCategory;
  summary: string;
  description: string;
  defaultLabel: string;
  tags: readonly string[];
  visual: FoundationBlockVisualToken;
  inputs: readonly FoundationBlockPort[];
  outputs: readonly FoundationBlockPort[];
  defaultConfig: Record<string, unknown>;
};
