use crate::domain::c_project as c_project_domain;
use crate::domain::c_project::{
    CProjectScanSummary, CProjectWorkspaceScanResult, CscFolder,
};

#[tauri::command]
pub async fn scan_c_project_workspace(
    project_path: String,
) -> Result<CProjectWorkspaceScanResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        c_project_domain::scan_c_project_workspace_blocking(&project_path)
    })
    .await
    .map_err(|err| format!("Project workspace scan task failed: {}", err))?
}

#[tauri::command]
pub async fn scan_c_project(project_path: String) -> Result<CProjectScanSummary, String> {
    tauri::async_runtime::spawn_blocking(move || {
        c_project_domain::scan_c_project_blocking(&project_path)
    })
    .await
    .map_err(|err| format!("Project scan task failed: {}", err))?
}

#[tauri::command]
pub async fn list_csc_folders(project_path: String) -> Result<Vec<CscFolder>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        c_project_domain::list_csc_folders_blocking(&project_path)
    })
    .await
    .map_err(|err| format!("CSC folder scan task failed: {}", err))?
}