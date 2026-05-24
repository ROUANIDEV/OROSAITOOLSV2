use std::fs;
use std::path::{Path, PathBuf};

const FILE_EXTENSION: &str = "json";
const BACKUP_EXTENSION: &str = "json.bak";
const TEMP_EXTENSION: &str = "json.tmp";

pub fn storage_root_path(app_data_dir: PathBuf) -> PathBuf {
    app_data_dir.join("data")
}

pub fn ensure_storage_root(storage_root: &Path) -> Result<PathBuf, String> {
    if storage_root.exists() && !storage_root.is_dir() {
        return Err(format!(
            "Storage path exists but is not a directory: {}",
            storage_root.display()
        ));
    }

    fs::create_dir_all(storage_root).map_err(|error| {
        format!(
            "Failed to create app data directory '{}': {error}",
            storage_root.display()
        )
    })?;

    Ok(storage_root.to_path_buf())
}

pub(crate) fn storage_file_path(storage_root: &Path, key: &str) -> PathBuf {
    storage_root.join(format!("{key}.{FILE_EXTENSION}"))
}

pub(crate) fn backup_file_path(storage_root: &Path, key: &str) -> PathBuf {
    storage_root.join(format!("{key}.{BACKUP_EXTENSION}"))
}

pub(crate) fn temp_file_path(storage_root: &Path, key: &str) -> PathBuf {
    storage_root.join(format!("{key}.{TEMP_EXTENSION}"))
}