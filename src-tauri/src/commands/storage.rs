use crate::domain::storage;
use crate::domain::storage::AppDataDocument;
use serde_json::Value;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const STORAGE_DIR_NAME: &str = "data";

#[tauri::command]
pub fn app_data_path(app: AppHandle) -> Result<String, String> {
    let path = storage_root(&app)?;

    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn app_data_reveal(app: AppHandle) -> Result<(), String> {
    let root = storage_root(&app)?;

    tauri::async_runtime::spawn_blocking(move || storage::reveal_storage_root(&root))
        .await
        .map_err(|error| format!("Open app data folder task failed: {error}"))?
}

#[tauri::command]
pub fn app_data_read(
    app: AppHandle,
    key: String,
) -> Result<Option<AppDataDocument>, String> {
    let root = storage_root(&app)?;

    storage::read_document(&root, &key)
}

#[tauri::command]
pub fn app_data_write(
    app: AppHandle,
    key: String,
    data: Value,
) -> Result<AppDataDocument, String> {
    let root = storage_root(&app)?;

    storage::write_document(&root, &key, data)
}

#[tauri::command]
pub fn app_data_delete(app: AppHandle, key: String) -> Result<(), String> {
    let root = storage_root(&app)?;

    storage::delete_document(&root, &key)
}

fn storage_root(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to resolve app data directory: {error}"))?;

    let storage_dir = app_data_dir.join(STORAGE_DIR_NAME);

    std::fs::create_dir_all(&storage_dir).map_err(|error| {
        format!(
            "Failed to create app data directory '{}': {error}",
            storage_dir.display()
        )
    })?;

    Ok(storage_dir)
}