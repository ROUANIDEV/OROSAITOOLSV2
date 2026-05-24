use std::fs;
use std::io::Write;
use std::path::Path;

pub fn durable_write_with_backup(
    path: &Path,
    temp_path: &Path,
    backup_path: &Path,
    bytes: &[u8],
) -> Result<(), String> {
    ensure_parent_directory(path)?;
    remove_file_if_exists(temp_path)?;
    write_temp_file(temp_path, bytes)?;

    remove_file_if_exists(backup_path)?;
    move_existing_file_to_backup(path, backup_path)?;

    fs::rename(temp_path, path).map_err(|error| {
        let _ = restore_backup(path, backup_path);
        let _ = remove_file_if_exists(temp_path);

        format!(
            "Failed to move temporary app data file '{}' to '{}': {error}",
            temp_path.display(),
            path.display()
        )
    })?;

    remove_file_if_exists(backup_path)?;
    Ok(())
}

pub fn remove_file_if_exists(path: &Path) -> Result<(), String> {
    if path.exists() {
        fs::remove_file(path).map_err(|error| {
            format!("Failed to remove file '{}': {error}", path.display())
        })?;
    }

    Ok(())
}

fn ensure_parent_directory(path: &Path) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| format!("Invalid app data path '{}'.", path.display()))?;

    fs::create_dir_all(parent).map_err(|error| {
        format!(
            "Failed to create parent directory '{}': {error}",
            parent.display()
        )
    })
}

fn write_temp_file(temp_path: &Path, bytes: &[u8]) -> Result<(), String> {
    let mut file = fs::File::create(temp_path).map_err(|error| {
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
    })
}

fn move_existing_file_to_backup(
    path: &Path,
    backup_path: &Path,
) -> Result<(), String> {
    if path.exists() {
        fs::rename(path, backup_path).map_err(|error| {
            format!(
                "Failed to move previous app data file '{}' to backup '{}': {error}",
                path.display(),
                backup_path.display()
            )
        })?;
    }

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