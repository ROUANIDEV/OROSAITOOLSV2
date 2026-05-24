use std::fs;
use std::path::Path;

use serde_json::Value;

use crate::domain::storage::AppDataDocument;

use super::durable_file::{
    durable_write_with_backup,
    remove_file_if_exists,
};

use super::key::validate_storage_key;

use super::paths::{
    backup_file_path,
    ensure_storage_root,
    storage_file_path,
    temp_file_path,
};

use super::time::now_ms;

pub fn read_document(
    storage_root: &Path,
    key: &str,
) -> Result<Option<AppDataDocument>, String> {
    let safe_key = validate_storage_key(key)?;
    let path = storage_file_path(storage_root, &safe_key);
    let backup_path = backup_file_path(storage_root, &safe_key);

    if path.exists() {
        return read_document_from_path(&path).map(Some);
    }

    if backup_path.exists() {
        return read_document_from_path(&backup_path).map(Some);
    }

    Ok(None)
}

pub fn write_document(
    storage_root: &Path,
    key: &str,
    data: Value,
) -> Result<AppDataDocument, String> {
    let safe_key = validate_storage_key(key)?;
    ensure_storage_root(storage_root)?;

    let document = AppDataDocument::new(safe_key.clone(), now_ms(), data);
    let bytes = serialize_document(&document)?;

    let path = storage_file_path(storage_root, &safe_key);
    let temp_path = temp_file_path(storage_root, &safe_key);
    let backup_path = backup_file_path(storage_root, &safe_key);

    durable_write_with_backup(&path, &temp_path, &backup_path, &bytes)?;
    Ok(document)
}

pub fn delete_document(storage_root: &Path, key: &str) -> Result<(), String> {
    let safe_key = validate_storage_key(key)?;

    let path = storage_file_path(storage_root, &safe_key);
    let backup_path = backup_file_path(storage_root, &safe_key);
    let temp_path = temp_file_path(storage_root, &safe_key);

    remove_file_if_exists(&path)?;
    remove_file_if_exists(&backup_path)?;
    remove_file_if_exists(&temp_path)?;

    Ok(())
}

fn read_document_from_path(path: &Path) -> Result<AppDataDocument, String> {
    let raw = fs::read_to_string(path).map_err(|error| {
        format!(
            "Failed to read app data file '{}': {error}",
            path.display()
        )
    })?;

    serde_json::from_str::<AppDataDocument>(&raw).map_err(|error| {
        format!(
            "Failed to parse app data file '{}'. The file may be corrupted: {error}",
            path.display()
        )
    })
}

fn serialize_document(document: &AppDataDocument) -> Result<Vec<u8>, String> {
    serde_json::to_vec_pretty(document)
        .map_err(|error| format!("Failed to serialize app data document: {error}"))
}