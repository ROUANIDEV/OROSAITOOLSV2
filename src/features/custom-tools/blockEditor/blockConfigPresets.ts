import type { CustomToolBlockType } from "../model/customToolTypes";

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
  "file.appendText": {
    targetInput: "",
    textFromBlock: "",
  },
  "text.template": {
    template: "Hello {{name}}",
  },
  "safety.preview": {
    title: "Preview changes",
  },
  "safety.confirm": {
    message: "Do you want to continue?",
  },
  "python.code": {
    code: "import json\nimport sys\n\npayload = json.load(sys.stdin)\njson.dump(payload, sys.stdout)",
    timeoutSeconds: 10,
  },
};