import { invokeTauriCommand } from "@/api/tauri/invokeTauriCommand";
import { tauriCommandNames } from "@/api/tauri/tauriCommandNames";

import type {
  CProjectScanSummary,
  CProjectWorkspaceScanResult,
  CscFolder,
} from "@/api/c-project/cProjectTypes";

export async function scanCProjectWorkspace(
  projectPath: string,
): Promise<CProjectWorkspaceScanResult> {
  return invokeTauriCommand<CProjectWorkspaceScanResult>(
    tauriCommandNames.scanCProjectWorkspace,
    { projectPath },
  );
}

export async function scanCProject(
  projectPath: string,
): Promise<CProjectScanSummary> {
  return invokeTauriCommand<CProjectScanSummary>(
    tauriCommandNames.scanCProject,
    { projectPath },
  );
}

export async function listCscFolders(projectPath: string): Promise<CscFolder[]> {
  return invokeTauriCommand<CscFolder[]>(tauriCommandNames.listCscFolders, {
    projectPath,
  });
}