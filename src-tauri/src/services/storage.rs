use std::path::PathBuf;

use serde_json::Value;
use tauri::{AppHandle, Manager};

use crate::domain::storage::AppDataDocument;
use crate::infrastructure::reports::reveal_path_in_file_manager;
use crate::infrastructure::storage as storage_repository;
use crate::shared::blocking::run_blocking;

pub fn app_data_path(app: AppHandle) -> Result<String, String> {
    let root = resolve_storage_root(&app)?;
    Ok(root.to_string_lossy().to_string())
}

pub async fn app_data_reveal(app: AppHandle) -> Result<(), String> {
    let root = resolve_storage_root(&app)?;

    run_blocking("Open app data folder", move || {
        storage_repository::ensure_storage_root(&root)?;

        reveal_path_in_file_manager(&root)
    })
    .await
}

pub fn app_data_read(
    app: AppHandle,
    key: String,
) -> Result<Option<AppDataDocument>, String> {
    let root = resolve_storage_root(&app)?;
    storage_repository::read_document(&root, &key)
}

pub fn app_data_write(
    app: AppHandle,
    key: String,
    data: Value,
) -> Result<AppDataDocument, String> {
    let root = resolve_storage_root(&app)?;
    storage_repository::write_document(&root, &key, data)
}

pub fn app_data_delete(app: AppHandle, key: String) -> Result<(), String> {
    let root = resolve_storage_root(&app)?;
    storage_repository::delete_document(&root, &key)
}

fn resolve_storage_root(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to resolve app data directory: {error}"))?;

    let storage_root = storage_repository::storage_root_path(app_data_dir);
    storage_repository::ensure_storage_root(&storage_root)
}