use crate::domain::c_project::{
    CProjectScanSummary,
    CProjectWorkspaceScanResult,
    CscFolder,
};

use crate::infrastructure::c_project as c_project_scanner;
use crate::shared::blocking::run_blocking;

pub async fn scan_workspace(
    project_path: String,
) -> Result<CProjectWorkspaceScanResult, String> {
    run_blocking("Project workspace scan", move || {
        c_project_scanner::scan_workspace(&project_path)
    })
    .await
}

pub async fn scan_project(
    project_path: String,
) -> Result<CProjectScanSummary, String> {
    run_blocking("Project scan", move || {
        c_project_scanner::scan_project(&project_path)
    })
    .await
}

pub async fn list_csc_folders(
    project_path: String,
) -> Result<Vec<CscFolder>, String> {
    run_blocking("CSC folder scan", move || {
        c_project_scanner::list_csc_folders(&project_path)
    })
    .await
}