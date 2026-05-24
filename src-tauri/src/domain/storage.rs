use crate::domain::reports::reveal_path_in_file_manager;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    fs,
    io::Write,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

const FILE_EXTENSION: &str = "json";
const BACKUP_EXTENSION: &str = "json.bak";
const TEMP_EXTENSION: &str = "json.tmp";
const CURRENT_SCHEMA_VERSION: u16 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppDataDocument {
    pub schema_version: u16,
    pub key: String,
    pub updated_at_ms: u64,
    pub data: Value,
}

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

    fs::create_dir_all(storage_root).map_err(|error| {
        format!(
            "Failed to create app data directory '{}': {error}",
            storage_root.display()
        )
    })?;

    let document = AppDataDocument {
        schema_version: CURRENT_SCHEMA_VERSION,
        key: safe_key.clone(),
        updated_at_ms: now_ms(),
        data,
    };

    let bytes = serde_json::to_vec_pretty(&document)
        .map_err(|error| format!("Failed to serialize app data document: {error}"))?;

    let path = storage_file_path(storage_root, &safe_key);
    durable_write_with_backup(&path, &bytes)?;

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

pub fn reveal_storage_root(storage_root: &Path) -> Result<(), String> {
    fs::create_dir_all(storage_root).map_err(|error| {
        format!(
            "Failed to create app data directory '{}': {error}",
            storage_root.display()
        )
    })?;

    let path = storage_root.to_string_lossy().to_string();

    reveal_path_in_file_manager(&path)
}

pub fn validate_storage_key(key: &str) -> Result<String, String> {
    let trimmed = key.trim();

    if trimmed.is_empty() {
        return Err("Storage key cannot be empty.".to_string());
    }

    if trimmed.len() > 120 {
        return Err("Storage key is too long. Maximum length is 120 characters.".to_string());
    }

    if trimmed.starts_with('.') || trimmed.ends_with('.') || trimmed.contains("..") {
        return Err("Storage key cannot start/end with a dot or contain '..'.".to_string());
    }

    let is_valid = trimmed.chars().all(|character| {
        character.is_ascii_alphanumeric()
            || character == '.'
            || character == '_'
            || character == '-'
    });

    if !is_valid {
        return Err(
            "Storage key can only contain letters, numbers, dots, underscores, and dashes."
                .to_string(),
        );
    }

    Ok(trimmed.to_string())
}

fn read_document_from_path(path: &Path) -> Result<AppDataDocument, String> {
    let raw = fs::read_to_string(path)
        .map_err(|error| format!("Failed to read app data file '{}': {error}", path.display()))?;

    serde_json::from_str::<AppDataDocument>(&raw).map_err(|error| {
        format!(
            "Failed to parse app data file '{}'. The file may be corrupted: {error}",
            path.display()
        )
    })
}

fn durable_write_with_backup(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| format!("Invalid app data path '{}'.", path.display()))?;

    fs::create_dir_all(parent).map_err(|error| {
        format!(
            "Failed to create parent directory '{}': {error}",
            parent.display()
        )
    })?;

    let temp_path = path.with_extension(TEMP_EXTENSION);
    let backup_path = path.with_extension(BACKUP_EXTENSION);

    remove_file_if_exists(&temp_path)?;

    {
        let mut file = fs::File::create(&temp_path).map_err(|error| {
            format!(
                "Failed to create temporary app data file '{}': {error}",
                temp_path.display()
            )
        })?;

        file.write_all(bytes).map_err(|error| {
            format!(
                "Failed to write temporary app data file '{}': {error}",
                temp_path.display()
            )
        })?;

        file.sync_all().map_err(|error| {
            format!(
                "Failed to sync temporary app data file '{}': {error}",
                temp_path.display()
            )
        })?;
    }

    remove_file_if_exists(&backup_path)?;

    if path.exists() {
        fs::rename(path, &backup_path).map_err(|error| {
            format!(
                "Failed to move previous app data file '{}' to backup '{}': {error}",
                path.display(),
                backup_path.display()
            )
        })?;
    }

    fs::rename(&temp_path, path).map_err(|error| {
        let _ = restore_backup(path, &backup_path);
        let _ = remove_file_if_exists(&temp_path);

        format!(
            "Failed to move temporary app data file '{}' to '{}': {error}",
            temp_path.display(),
            path.display()
        )
    })?;

    remove_file_if_exists(&backup_path)?;

    Ok(())
}

fn restore_backup(path: &Path, backup_path: &Path) -> Result<(), String> {
    if backup_path.exists() && !path.exists() {
        fs::rename(backup_path, path).map_err(|error| {
            format!(
                "Failed to restore app data backup '{}' to '{}': {error}",
                backup_path.display(),
                path.display()
            )
        })?;
    }

    Ok(())
}

fn remove_file_if_exists(path: &Path) -> Result<(), String> {
    if path.exists() {
        fs::remove_file(path)
            .map_err(|error| format!("Failed to remove file '{}': {error}", path.display()))?;
    }

    Ok(())
}

fn storage_file_path(storage_root: &Path, key: &str) -> PathBuf {
    storage_root.join(format!("{key}.{FILE_EXTENSION}"))
}

fn backup_file_path(storage_root: &Path, key: &str) -> PathBuf {
    storage_root.join(format!("{key}.{BACKUP_EXTENSION}"))
}

fn temp_file_path(storage_root: &Path, key: &str) -> PathBuf {
    storage_root.join(format!("{key}.{TEMP_EXTENSION}"))
}

fn now_ms() -> u64 {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();

    u64::try_from(millis).unwrap_or(u64::MAX)
}