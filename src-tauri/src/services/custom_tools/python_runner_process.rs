use serde_json::Value;
use std::{
    fs::{self, File},
    io::Write,
    path::PathBuf,
    process::{Command, Stdio},
    thread,
    time::{Duration, Instant},
};

use crate::domain::custom_tools::CustomToolPythonRunResult;

use super::python_runner_spec::PythonCommandSpec;

pub fn run_with_python_spec(
    spec: &PythonCommandSpec,
    code: &str,
    stdin_bytes: &[u8],
    timeout: Duration,
    stdout_path: &PathBuf,
    stderr_path: &PathBuf,
) -> Result<CustomToolPythonRunResult, String> {
    let stdout_file = File::create(stdout_path).map_err(|error| error.to_string())?;
    let stderr_file = File::create(stderr_path).map_err(|error| error.to_string())?;

    let mut command = Command::new(&spec.program);
    command.args(&spec.args);
    command.arg("-c").arg(code);
    command.stdin(Stdio::piped());
    command.stdout(Stdio::from(stdout_file));
    command.stderr(Stdio::from(stderr_file));

    let start = Instant::now();
    let mut child = command
        .spawn()
        .map_err(|error| format!("{}: {error}", spec.program))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(stdin_bytes)
            .map_err(|error| format!("Unable to write Python stdin: {error}"))?;
    }

    loop {
        if let Some(status) = child.try_wait().map_err(|error| error.to_string())? {
            return finish_result(status.code(), false, start, stdout_path, stderr_path);
        }

        if start.elapsed() >= timeout {
            let _ = child.kill();
            let _ = child.wait();
            return finish_result(None, true, start, stdout_path, stderr_path);
        }

        thread::sleep(Duration::from_millis(25));
    }
}

fn finish_result(
    exit_code: Option<i32>,
    timed_out: bool,
    start: Instant,
    stdout_path: &PathBuf,
    stderr_path: &PathBuf,
) -> Result<CustomToolPythonRunResult, String> {
    let stdout = fs::read_to_string(stdout_path).unwrap_or_default();
    let stderr = fs::read_to_string(stderr_path).unwrap_or_default();
    let duration_ms = start.elapsed().as_millis().min(u64::MAX as u128) as u64;

    if timed_out || exit_code != Some(0) {
        return Ok(CustomToolPythonRunResult {
            output_json: Value::Null,
            stdout,
            stderr,
            exit_code,
            timed_out,
            duration_ms,
        });
    }

    if stdout.trim().is_empty() {
        return Err("Python code must print JSON to stdout.".to_string());
    }

    let output_json = serde_json::from_str(stdout.trim())
        .map_err(|error| format!("Python stdout must be valid JSON: {error}"))?;

    Ok(CustomToolPythonRunResult {
        output_json,
        stdout,
        stderr,
        exit_code,
        timed_out,
        duration_ms,
    })
}
