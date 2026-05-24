use serde_json::Value;
use tauri::AppHandle;

use crate::domain::storage::AppDataDocument;
use crate::services::storage as service;

#[tauri::command]
pub fn app_data_path(app: AppHandle) -> Result<String, String> {
    service::app_data_path(app)
}

#[tauri::command]
pub async fn app_data_reveal(app: AppHandle) -> Result<(), String> {
    service::app_data_reveal(app).await
}

#[tauri::command]
pub fn app_data_read(
    app: AppHandle,
    key: String,
) -> Result<Option<AppDataDocument>, String> {
    service::app_data_read(app, key)
}

#[tauri::command]
pub fn app_data_write(
    app: AppHandle,
    key: String,
    data: Value,
) -> Result<AppDataDocument, String> {
    service::app_data_write(app, key, data)
}

#[tauri::command]
pub fn app_data_delete(app: AppHandle, key: String) -> Result<(), String> {
    service::app_data_delete(app, key)
}