use serde::Serialize;
use serde_json::Value;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomToolFileGlobMatch {
    pub path: String,
    pub relative_path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomToolFileGlobResult {
    pub root_path: String,
    pub pattern: String,
    pub files: Vec<CustomToolFileGlobMatch>,
    pub matched_count: usize,
    pub returned_count: usize,
    pub truncated: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomToolAppendTextResult {
    pub target_path: String,
    pub bytes_appended: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomToolPythonRunResult {
    pub output_json: Value,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
    pub timed_out: bool,
    pub duration_ms: u64,
}
