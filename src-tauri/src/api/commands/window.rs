use tauri::AppHandle;

use crate::services::window_lifecycle;

#[tauri::command]
pub async fn splashscreen_ready(app: AppHandle) -> Result<(), String> {
    window_lifecycle::splashscreen_ready(app).await
}

#[tauri::command]
pub async fn frontend_ready(app: AppHandle) -> Result<(), String> {
    window_lifecycle::frontend_ready(app).await
}