use std::fs;
use std::path::{Path, PathBuf};

use super::path_utils::{
    is_source_file,
    path_to_string,
    should_ignore_dir,
};

pub fn collect_source_files(root: &Path) -> Result<Vec<PathBuf>, String> {
    let mut source_files = Vec::new();

    collect_from_folder(root, &mut source_files)?;
    source_files.sort();

    Ok(source_files)
}

fn collect_from_folder(
    folder: &Path,
    source_files: &mut Vec<PathBuf>,
) -> Result<(), String> {
    if should_ignore_dir(folder) {
        return Ok(());
    }

    for entry in read_dir_sorted(folder)? {
        let path = entry.path();

        if path.is_dir() {
            collect_from_folder(&path, source_files)?;
            continue;
        }

        if path.is_file() && is_source_file(&path) {
            source_files.push(path);
        }
    }

    Ok(())
}

fn read_dir_sorted(folder: &Path) -> Result<Vec<fs::DirEntry>, String> {
    let read_dir = fs::read_dir(folder).map_err(|error| {
        format!("Failed to read folder {}: {error}", path_to_string(folder))
    })?;

    let mut entries = Vec::new();

    for entry_result in read_dir {
        let entry = entry_result.map_err(|error| {
            format!(
                "Failed to read folder entry in {}: {error}",
                path_to_string(folder)
            )
        })?;

        entries.push(entry);
    }

    entries.sort_by_key(|entry| entry.path());
    Ok(entries)
}