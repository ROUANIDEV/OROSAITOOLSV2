export {
  listCscFolders,
  scanCProject,
  scanCProjectWorkspace,
} from "@/api/c-project/cProjectApi";

export type {
  CProjectScanSummary,
  CProjectWorkspaceScanResult,
  CscFolder,
  ScannedFile,
} from "@/api/c-project/cProjectTypes";