export type CustomToolStatus = "draft" | "tested" | "published";

export type CustomToolInputType =
  | "text"
  | "textarea"
  | "file"
  | "folder"
  | "number"
  | "boolean";

export const customToolExecutableBlockTypes = [
  "file.glob",
  "file.read",
  "file.appendText",
  "text.template",
  "safety.preview",
  "safety.confirm",
  "python.code",
] as const;

export type CustomToolExecutableBlockType =
  (typeof customToolExecutableBlockTypes)[number];

export const customToolFoundationBlockTypes = [
  "io.input",
  "io.output",
  "variable.create",
  "variable.assign",
  "variable.update",
  "constant.create",
  "expression.value",
  "expression.template",
  "math.operation",
  "logic.compare",
  "scope.global",
  "scope.local",
  "function.define",
  "function.call",
  "control.if",
  "control.switch",
  "loop.for",
  "loop.forEach",
  "loop.while",
  "collection.array",
  "collection.list",
  "collection.dictionary",
  "collection.get",
  "collection.set",
  "collection.sort",
] as const;

export type CustomToolFoundationBlockType =
  (typeof customToolFoundationBlockTypes)[number];

export type CustomToolBlockType =
  | CustomToolExecutableBlockType
  | CustomToolFoundationBlockType;

export type CustomToolBlockExecutionMode = "runtime" | "model";

export type WorkflowConnectionStyle = "solid" | "dashed" | "curved";

export type CustomToolWorkflowConnection = {
  id: string;
  fromBlockId: string;
  toBlockId: string;
  fromPortId?: string;
  toPortId?: string;
  style: WorkflowConnectionStyle;
};

export type CustomToolInput = {
  id: string;
  label: string;
  type: CustomToolInputType;
  required: boolean;
  description?: string;
  accept?: string[];
};

export type CustomToolOutput = {
  id: string;
  label: string;
  type: CustomToolInputType | "json" | "array" | "object" | "unknown";
  description?: string;
};

export type CustomToolBlock = {
  id: string;
  type: CustomToolBlockType;
  label: string;
  description: string;
  executionMode?: CustomToolBlockExecutionMode;
  config: Record<string, unknown>;
};

export type CustomToolPermissionSet = {
  fileRead: boolean;
  fileWrite: boolean;
  python: boolean;
  network: boolean;
};

export type CustomToolWorkflow = {
  blocks: CustomToolBlock[];
  visualConnections?: CustomToolWorkflowConnection[];
};

export type CustomToolManifest = {
  schemaVersion: 1;
  id: string;
  name: string;
  description: string;
  status: CustomToolStatus;
  createdAt: string;
  updatedAt: string;
  inputs: CustomToolInput[];
  outputs?: CustomToolOutput[];
  workflow: CustomToolWorkflow;
  permissions: CustomToolPermissionSet;
};

export function isExecutableCustomToolBlockType(
  value: unknown,
): value is CustomToolExecutableBlockType {
  return (
    typeof value === "string" &&
    (customToolExecutableBlockTypes as readonly string[]).includes(value)
  );
}

export function isFoundationCustomToolBlockType(
  value: unknown,
): value is CustomToolFoundationBlockType {
  return (
    typeof value === "string" &&
    (customToolFoundationBlockTypes as readonly string[]).includes(value)
  );
}
