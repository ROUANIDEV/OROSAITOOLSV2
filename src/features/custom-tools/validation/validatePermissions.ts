import type { CustomToolManifest } from "../model/customToolTypes";

type PermissionValidationIssue = {
  id: string;
  level: "error" | "warning";
  message: string;
};

function createIssue(message: string): PermissionValidationIssue {
  return {
    id: `permission-${message.toLowerCase().replace(/\W+/g, "-")}`,
    level: "error",
    message,
  };
}

export function validatePermissions(
  draft: CustomToolManifest,
): PermissionValidationIssue[] {
  const issues: PermissionValidationIssue[] = [];
  const blocks = draft.workflow.blocks;

  const usesFileRead = blocks.some((block) => {
    return block.type === "file.glob" || block.type === "file.read";
  });

  const usesFileWrite = blocks.some((block) => {
    return block.type === "file.appendText";
  });

  const usesPython = blocks.some((block) => {
    return block.type === "python.code";
  });

  if (usesFileRead && !draft.permissions.fileRead) {
    issues.push(createIssue("File read blocks require fileRead permission."));
  }

  if (usesFileWrite && !draft.permissions.fileWrite) {
    issues.push(createIssue("Append blocks require fileWrite permission."));
  }

  if (usesPython && !draft.permissions.python) {
    issues.push(createIssue("Python blocks require python permission."));
  }

  if (draft.permissions.network) {
    issues.push({
      id: "permission-network-warning",
      level: "warning",
      message: "Network permission is reserved for future controlled execution.",
    });
  }

  return issues;
}