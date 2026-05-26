import type { CustomToolBlockType } from "../../domain/customToolTypes";

const pythonStarterCode = [
  "import json",
  "import sys",
  "",
  "payload = json.load(sys.stdin)",
  "inputs = payload.get(\"inputs\", {})",
  "",
  "print(json.dumps({",
  " \"ok\": True,",
  " \"inputKeys\": list(inputs.keys())",
  "}))",
].join("\n");

export const defaultBlockConfigByType: Record<
  CustomToolBlockType,
  Record<string, unknown>
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
};

export const blockConfigPresets = defaultBlockConfigByType;

export function getBlockConfigPreset(type: CustomToolBlockType) {
  return {
    ...(defaultBlockConfigByType[type] ?? {}),
  };
}

export function createBlockConfigPreset(type: CustomToolBlockType) {
  return getBlockConfigPreset(type);
}