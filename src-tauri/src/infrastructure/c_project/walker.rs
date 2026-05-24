use std::fs;
use std::path::{Path, PathBuf};

use super::file_kind::{
    classify_file_kind,
    file_kind_to_label,
};

use super::file_record::FileRecord;

use super::path_utils::{
    path_to_string,
    relative_path_to_string,
    should_ignore_dir,
};

pub fn walk_project(
    root: &Path,
) -> Result<(Vec<PathBuf>, Vec<FileRecord>), String> {
    let mut directories = Vec::new();
    let mut files = Vec::new();

    walk_folder(root, root, &mut directories, &mut files)?;

    directories.sort();
    files.sort_by(|a, b| a.path.cmp(&b.path));

    Ok((directories, files))
}

fn walk_folder(
    root: &Path,
    folder: &Path,
    directories: &mut Vec<PathBuf>,
    files: &mut Vec<FileRecord>,
) -> Result<(), String> {
    for entry in read_dir_sorted(folder)? {
        let path = entry.path();

        if path.is_dir() {
            visit_directory(root, &path, directories, files)?;
            continue;
        }

        if path.is_file() {
            files.push(read_file_record(root, path)?);
        }
    }

    Ok(())
}

fn visit_directory(
    root: &Path,
    path: &Path,
    directories: &mut Vec<PathBuf>,
    files: &mut Vec<FileRecord>,
) -> Result<(), String> {
    if should_ignore_dir(path) {
        return Ok(());
    }

    directories.push(path.to_path_buf());
    walk_folder(root, path, directories, files)
}

fn read_file_record(root: &Path, path: PathBuf) -> Result<FileRecord, String> {
    let metadata = fs::metadata(&path).map_err(|error| {
        format!(
            "Failed to read file metadata for {}: {error}",
            path_to_string(&path)
        )
    })?;

    let kind = classify_file_kind(&path);

    Ok(FileRecord {
        relative_path: relative_path_to_string(root, &path),
        file_type: file_kind_to_label(kind).to_string(),
        size_bytes: metadata.len(),
        kind,
        path,
    })
}

fn read_dir_sorted(folder: &Path) -> Result<Vec<fs::DirEntry>, String> {
    let mut entries = Vec::new();

    for entry_result in fs::read_dir(folder).map_err(|error| {
        format!("Failed to read folder {}: {error}", path_to_string(folder))
    })? {
        entries.push(entry_result.map_err(|error| {
            format!(
                "Failed to read folder entry in {}: {error}",
                path_to_string(folder)
            )
        })?);
    }

    entries.sort_by_key(|entry| entry.path());
    Ok(entries)
}