use crate::domain::call_tree::{
    analyze_call_tree_folder, export_call_tree_excel, CallTreeExportResult, CallTreeSummary,
};

#[tauri::command]
pub async fn analyze_call_tree(csc_path: String) -> Result<CallTreeSummary, String> {
    tauri::async_runtime::spawn_blocking(move || analyze_call_tree_folder(&csc_path))
        .await
        .map_err(|err| format!("Call Tree analysis task failed: {}", err))?
}

#[tauri::command]
pub async fn export_call_tree_xlsx(csc_path: String) -> Result<CallTreeExportResult, String> {
    tauri::async_runtime::spawn_blocking(move || export_call_tree_excel(&csc_path))
        .await
        .map_err(|err| format!("Call Tree export task failed: {}", err))?
}