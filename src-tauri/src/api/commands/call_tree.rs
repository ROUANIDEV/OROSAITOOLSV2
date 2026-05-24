use crate::domain::call_tree::{
    CallTreeExportResult,
    CallTreeSummary,
};

use crate::services::call_tree as service;

#[tauri::command]
pub async fn analyze_call_tree(
    csc_path: String,
) -> Result<CallTreeSummary, String> {
    service::analyze(csc_path).await
}

#[tauri::command]
pub async fn export_call_tree_xlsx(
    csc_path: String,
) -> Result<CallTreeExportResult, String> {
    service::export_xlsx(csc_path).await
}