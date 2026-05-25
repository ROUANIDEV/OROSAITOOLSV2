use serde_json::Value;
use std::{
    env, fs,
    path::PathBuf,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use crate::domain::custom_tools::CustomToolPythonRunResult;

use super::python_runner_process::run_with_python_spec;
use super::python_runner_spec::python_command_specs;

const DEFAULT_TIMEOUT_MS: u64 = 5_000;
const HARD_TIMEOUT_MS: u64 = 15_000;

pub async fn run_python_code(
    code: String,
    input_json: Value,
    timeout_ms: Option<u64>,
    python_permission: bool,
) -> Result<CustomToolPythonRunResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        run_python_code_sync(code, input_json, timeout_ms, python_permission)
    })
    .await
    .map_err(|error| error.to_string())?
}

fn run_python_code_sync(
    code: String,
    input_json: Value,
    timeout_ms: Option<u64>,
    python_permission: bool,
) -> Result<CustomToolPythonRunResult, String> {
    if !python_permission {
        return Err("This tool does not have python permission.".to_string());
    }

    if code.trim().is_empty() {
        return Err("Python code block is empty.".to_string());
    }

    let timeout = Duration::from_millis(
        timeout_ms
            .unwrap_or(DEFAULT_TIMEOUT_MS)
            .clamp(1_000, HARD_TIMEOUT_MS),
    );

    let stdin_bytes = serde_json::to_vec(&input_json)
        .map_err(|error| format!("Unable to serialize Python stdin JSON: {error}"))?;

    let stdout_path = temp_file_path("stdout");
    let stderr_path = temp_file_path("stderr");

    let result = run_with_available_python(
        code,
        stdin_bytes,
        timeout,
        &stdout_path,
        &stderr_path,
    );

    let _ = fs::remove_file(&stdout_path);
    let _ = fs::remove_file(&stderr_path);

    result
}

fn run_with_available_python(
    code: String,
    stdin_bytes: Vec<u8>,
    timeout: Duration,
    stdout_path: &PathBuf,
    stderr_path: &PathBuf,
) -> Result<CustomToolPythonRunResult, String> {
    let mut last_error = String::new();

    for spec in python_command_specs() {
        match run_with_python_spec(&spec, &code, &stdin_bytes, timeout, stdout_path, stderr_path) {
            Ok(result) => return Ok(result),
            Err(error) => last_error = error,
        }
    }

    Err(format!("Unable to start Python. {last_error}"))
}

fn temp_file_path(kind: &str) -> PathBuf {
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();

    env::temp_dir().join(format!(
        "orosai-python-{kind}-{}-{stamp}.txt",
        std::process::id()
    ))
}