use crate::domain::c_project::{
    CProjectScanSummary,
    CProjectWorkspaceScanResult,
    CscFolder,
};

use crate::services::c_project as service;

#[tauri::command]
pub async fn scan_c_project_workspace(
    project_path: String,
) -> Result<CProjectWorkspaceScanResult, String> {
    service::scan_workspace(project_path).await
}

#[tauri::command]
pub async fn scan_c_project(
    project_path: String,
) -> Result<CProjectScanSummary, String> {
    service::scan_project(project_path).await
}

#[tauri::command]
pub async fn list_csc_folders(
    project_path: String,
) -> Result<Vec<CscFolder>, String> {
    service::list_csc_folders(project_path).await
}