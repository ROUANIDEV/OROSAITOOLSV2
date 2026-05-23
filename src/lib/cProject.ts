import { invoke } from "@tauri-apps/api/core";

export type CscFolder = {
  name: string;
  path: string;
  relativePath: string;
  sourcesPath: string | null;
  includePath: string | null;
  cFiles: number;
  headerFiles: number;
};

export type ScannedFile = {
  path: string;
  relativePath: string;
  fileType: string;
  sizeBytes: number;
};

export type CProjectScanSummary = {
  rootPath: string;
  totalFiles: number;
  cFiles: number;
  headerFiles: number;
  assemblyFiles: number;
  otherFiles: number;
  totalSizeBytes: number;
  ignoredDirectories: string[];
  filePreview: ScannedFile[];
};

export type CProjectWorkspaceScanResult = {
  summary: CProjectScanSummary;
  cscFolders: CscFolder[];
};

export async function scanCProjectWorkspace(
  projectPath: string,
): Promise<CProjectWorkspaceScanResult> {
  return await invoke<CProjectWorkspaceScanResult>(
    "scan_c_project_workspace",
    {
      projectPath,
    },
  );
}

export async function scanCProject(
  projectPath: string,
): Promise<CProjectScanSummary> {
  return await invoke<CProjectScanSummary>("scan_c_project", {
    projectPath,
  });
}

export async function listCscFolders(
  projectPath: string,
): Promise<CscFolder[]> {
  return await invoke<CscFolder[]>("list_csc_folders", {
    projectPath,
  });
}