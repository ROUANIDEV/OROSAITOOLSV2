use serde_json::Value;

use crate::domain::custom_tools::{
    CustomToolAppendTextResult, CustomToolFileGlobResult, CustomToolPythonRunResult,
};
use crate::services::custom_tools as service;

#[tauri::command]
pub async fn custom_tool_scan_files(
    root_path: String,
    pattern: String,
    max_results: Option<usize>,
) -> Result<CustomToolFileGlobResult, String> {
    service::scan_files(root_path, pattern, max_results).await
}

#[tauri::command]
pub async fn custom_tool_append_text(
    target_path: String,
    text: String,
    confirmation: String,
    file_write_permission: bool,
) -> Result<CustomToolAppendTextResult, String> {
    service::append_text(
        target_path,
        text,
        confirmation,
        file_write_permission,
    )
    .await
}

#[tauri::command]
pub async fn custom_tool_run_python(
    code: String,
    input_json: Value,
    timeout_ms: Option<u64>,
    python_permission: bool,
) -> Result<CustomToolPythonRunResult, String> {
    service::run_python_code(code, input_json, timeout_ms, python_permission).await
}