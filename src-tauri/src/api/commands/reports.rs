use crate::services::reports;

#[tauri::command]
pub async fn reveal_path_in_file_manager(path: String) -> Result<(), String> {
    reports::reveal_path_in_file_manager(path).await
}