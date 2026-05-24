use std::path::{Path, PathBuf};

use crate::domain::c_project::{
    CProjectScanSummary,
    CProjectWorkspaceScanResult,
    CscFolder,
};

use super::csc_detector::detect_csc_folders;
use super::summary_builder::build_scan_summary;
use super::walker::walk_project;

pub fn scan_workspace(
    project_path: &str,
) -> Result<CProjectWorkspaceScanResult, String> {
    let root = validate_project_path(project_path)?;
    let (directories, files) = walk_project(&root)?;

    let summary = build_scan_summary(&root, &files);
    let csc_folders = detect_csc_folders(&root, &directories, &files);

    Ok(CProjectWorkspaceScanResult {
        summary,
        csc_folders,
    })
}

pub fn scan_project(project_path: &str) -> Result<CProjectScanSummary, String> {
    let result = scan_workspace(project_path)?;
    Ok(result.summary)
}

pub fn list_csc_folders(project_path: &str) -> Result<Vec<CscFolder>, String> {
    let result = scan_workspace(project_path)?;
    Ok(result.csc_folders)
}

fn validate_project_path(project_path: &str) -> Result<PathBuf, String> {
    let root = Path::new(project_path).to_path_buf();

    if !root.exists() {
        return Err(format!("Project path does not exist: {project_path}"));
    }

    if !root.is_dir() {
        return Err(format!("Project path is not a directory: {project_path}"));
    }

    Ok(root)
}