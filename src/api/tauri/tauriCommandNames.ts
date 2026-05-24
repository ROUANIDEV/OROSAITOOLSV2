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

  revealPathInFileManager: "reveal_path_in_file_manager",
} as const;

export type TauriCommandName =
  (typeof tauriCommandNames)[keyof typeof tauriCommandNames];