import {
  isExecutableCustomToolBlockType,
  isFoundationCustomToolBlockType,
  type CustomToolBlockType,
  type CustomToolExecutableBlockType,
} from "../../domain/customToolTypes";
import { getFoundationBlockDefinition } from "../foundation";

const pythonStarterCode = [
  "import json",
  "import sys",
  "",
  "payload = json.load(sys.stdin)",
  'inputs = payload.get("inputs", {})',
  "",
  "print(json.dumps({",
  '  "ok": True,',
  '  "inputKeys": list(inputs.keys())',
  "}))",
].join("\n");

function cloneConfig(config: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(config)) as Record<string, unknown>;
}

export const defaultBlockConfigByType: Partial<
  Record<CustomToolBlockType, Record<string, unknown>>
> = {
  "file.glob": {
    rootInput: "",
    pattern: "**/*",
  },
  "file.read": {
    fileInput: "",
  },
  "text.template": {
    template: "",
  },
  "python.code": {
    code: pythonStarterCode,
    timeoutMs: 5000,
  },
  "safety.preview": {
    title: "Preview changes",
  },
  "file.appendText": {
    targetInput: "",
  },
  "safety.confirm": {
    message: "Confirm before applying changes.",
  },
} satisfies Partial<
  Record<CustomToolExecutableBlockType, Record<string, unknown>>
>;

export const blockConfigPresets = defaultBlockConfigByType;

export function getBlockConfigPreset(
  type: CustomToolBlockType,
): Record<string, unknown> {
  if (isFoundationCustomToolBlockType(type)) {
    return cloneConfig(getFoundationBlockDefinition(type).defaultConfig);
  }

  if (isExecutableCustomToolBlockType(type)) {
    return cloneConfig(defaultBlockConfigByType[type] ?? {});
  }

  return {};
}

export function createBlockConfigPreset(
  type: CustomToolBlockType,
): Record<string, unknown> {
  return getBlockConfigPreset(type);
}