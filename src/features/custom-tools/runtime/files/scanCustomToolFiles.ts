import { invokeTauriCommand } from "@/api/tauri/invokeTauriCommand";
import { tauriCommandNames } from "@/api/tauri/tauriCommandNames";

export type CustomToolFileGlobMatch = {
  path: string;
  relativePath: string;
};

export type CustomToolFileGlobResult = {
  rootPath: string;
  pattern: string;
  files: CustomToolFileGlobMatch[];
  matchedCount: number;
  returnedCount: number;
  truncated: boolean;
};

type ScanCustomToolFilesArgs = {
  rootPath: string;
  pattern: string;
  maxResults?: number;
};

export async function scanCustomToolFiles({
  rootPath,
  pattern,
  maxResults = 200,
}: ScanCustomToolFilesArgs): Promise<CustomToolFileGlobResult> {
  return await invokeTauriCommand<CustomToolFileGlobResult>(
    tauriCommandNames.customToolScanFiles,
    {
      rootPath,
      pattern,
      maxResults,
    },
  );
}