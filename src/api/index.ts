export { getAppInfo } from "@/api/app/appApi";
export type { AppInfo } from "@/api/app/appTypes";

export {
  sendFrontendReadySignal,
  sendSplashscreenReadySignal,
} from "@/api/app/lifecycleApi";

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

export {
  analyzeCallTree,
  exportCallTreeXlsx,
} from "@/api/call-tree/callTreeApi";
export type {
  CallTreeAnalysisResult,
  CallTreeCall,
  CallTreeExportResult,
  CallTreeFunction,
} from "@/api/call-tree/callTreeTypes";

export {
  analyzeDataDictionary,
  exportDataDictionaryXlsx,
} from "@/api/data-dictionary/dataDictionaryApi";
export type {
  DataDictionaryAnalysisResult,
  DataDictionaryConstant,
  DataDictionaryDataType,
  DataDictionaryExportResult,
  DataDictionaryGlobalVariable,
} from "@/api/data-dictionary/dataDictionaryTypes";

export { revealPathInFileManager } from "@/api/reports/reportsApi";

export { tauriCommandNames } from "@/api/tauri/tauriCommandNames";
export type { TauriCommandName } from "@/api/tauri/tauriCommandNames";

export {
  invokeTauriCommand,
  TauriCommandError,
} from "@/api/tauri/invokeTauriCommand";