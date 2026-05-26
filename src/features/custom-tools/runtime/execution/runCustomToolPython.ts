import { invokeTauriCommand } from "@/api/tauri/invokeTauriCommand";
import { tauriCommandNames } from "@/api/tauri/tauriCommandNames";

export type CustomToolPythonRunResult = {
  outputJson: unknown;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  durationMs: number;
};

type RunCustomToolPythonArgs = {
  code: string;
  inputJson: unknown;
  timeoutMs?: number;
  pythonPermission: boolean;
};

export async function runCustomToolPython({
  code,
  inputJson,
  timeoutMs,
  pythonPermission,
}: RunCustomToolPythonArgs): Promise<CustomToolPythonRunResult> {
  return await invokeTauriCommand<CustomToolPythonRunResult>(
    tauriCommandNames.customToolRunPython,
    {
      code,
      inputJson,
      timeoutMs,
      pythonPermission,
    },
  );
}