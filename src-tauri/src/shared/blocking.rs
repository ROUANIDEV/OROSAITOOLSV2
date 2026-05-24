pub async fn run_blocking<T, F>(
    task_name: &'static str,
    job: F,
) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, String> + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(job)
        .await
        .map_err(|error| format!("{task_name} task failed: {error}"))?
}