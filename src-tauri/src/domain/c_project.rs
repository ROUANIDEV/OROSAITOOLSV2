use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CscFolder {
    pub name: String,
    pub path: String,
    pub relative_path: String,
    pub sources_path: Option<String>,
    pub include_path: Option<String>,
    pub c_files: usize,
    pub header_files: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannedFile {
    pub path: String,
    pub relative_path: String,
    pub file_type: String,
    pub size_bytes: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CProjectScanSummary {
    pub root_path: String,
    pub total_files: usize,
    pub c_files: usize,
    pub header_files: usize,
    pub assembly_files: usize,
    pub other_files: usize,
    pub total_size_bytes: u64,
    pub ignored_directories: Vec<String>,
    pub file_preview: Vec<ScannedFile>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CProjectWorkspaceScanResult {
    pub summary: CProjectScanSummary,
    pub csc_folders: Vec<CscFolder>,
}