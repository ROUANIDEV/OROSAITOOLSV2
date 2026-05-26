export interface CustomToolExecutionGuardInput {
  permissions?: Record<string, unknown> | null;
  requiresPython?: boolean;
  requiresFileAppend?: boolean;
  confirmationText?: string | null;
}

export type CustomToolExecutionGuardResult =
  | { ok: true }
  | { ok: false; reason: string };

function hasTruthyPermission(permissions: Record<string, unknown> | null | undefined, keys: string[]): boolean {
  if (!permissions) return false;
  return keys.some((key) => permissions[key] === true);
}

export function validateExecutionGuards({
  permissions,
  requiresPython = false,
  requiresFileAppend = false,
  confirmationText,
}: CustomToolExecutionGuardInput): CustomToolExecutionGuardResult {
  if (requiresPython && !hasTruthyPermission(permissions, ["python", "pythonPermission", "python_permission"])) {
    return { ok: false, reason: "Python execution permission is required." };
  }

  if (requiresFileAppend && !hasTruthyPermission(permissions, ["fileWrite", "fileAppend", "file_write_permission"])) {
    return { ok: false, reason: "File append permission is required." };
  }

  if (requiresFileAppend && confirmationText !== "APPEND") {
    return { ok: false, reason: "File append confirmation must be APPEND." };
  }

  return { ok: true };
}
