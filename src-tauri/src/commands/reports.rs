use crate::domain::reports::reveal_path_in_file_manager as reveal_report_path;

#[tauri::command]
pub async fn reveal_path_in_file_manager(path: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || reveal_report_path(&path))
        .await
        .map_err(|error| format!("Reveal report path task failed: {error}"))?
}