export type CustomToolStatus = "draft" | "tested" | "published";

export type CustomToolInputType =
  | "text"
  | "textarea"
  | "file"
  | "folder"
  | "number"
  | "boolean";

export type CustomToolBlockType =
  | "file.glob"
  | "file.read"
  | "file.appendText"
  | "text.template"
  | "safety.preview"
  | "safety.confirm"
  | "python.code";

export type CustomToolInput = {
  id: string;
  label: string;
  type: CustomToolInputType;
  required: boolean;
  description?: string;
  accept?: string[];
};

export type CustomToolBlock = {
  id: string;
  type: CustomToolBlockType;
  label: string;
  description: string;
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
  workflow: CustomToolWorkflow;
  permissions: CustomToolPermissionSet;
};