export const tauriCommandNames = {
  splashscreenReady: "splashscreen_ready",
  frontendReady: "frontend_ready",
  getAppInfo: "get_app_info",

  scanCProjectWorkspace: "scan_c_project_workspace",
  scanCProject: "scan_c_project",
  listCscFolders: "list_csc_folders",

  analyzeCallTree: "analyze_call_tree",
  exportCallTreeXlsx: "export_call_tree_xlsx",

  analyzeDataDictionary: "analyze_data_dictionary",
  exportDataDictionaryXlsx: "export_data_dictionary_xlsx",

  calculateCrc: "calculate_crc",

  customToolScanFiles: "custom_tool_scan_files",
  customToolAppendText: "custom_tool_append_text",
  customToolRunPython: "custom_tool_run_python",

  revealPathInFileManager: "reveal_path_in_file_manager",

  appDataPath: "app_data_path",
  appDataReveal: "app_data_reveal",
  appDataRead: "app_data_read",
  appDataWrite: "app_data_write",
  appDataDelete: "app_data_delete",
} as const;

export type TauriCommandName =
  (typeof tauriCommandNames)[keyof typeof tauriCommandNames];