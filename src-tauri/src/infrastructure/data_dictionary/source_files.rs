use std::fs;
use std::path::{Path, PathBuf};

use super::models::SourceDocument;

use super::path_utils::{
    is_header_file,
    is_source_file,
    path_to_string,
    relative_path_to_string,
    should_ignore_dir,
};

pub fn collect_source_documents(
    root: &Path,
) -> Result<Vec<SourceDocument>, String> {
    let mut paths = Vec::new();

    collect_paths(root, &mut paths)?;
    paths.sort();

    read_documents(root, &paths)
}

fn collect_paths(root: &Path, paths: &mut Vec<PathBuf>) -> Result<(), String> {
    if should_ignore_dir(root) {
        return Ok(());
    }

    for entry in read_dir_sorted(root)? {
        let path = entry.path();

        if path.is_dir() {
            collect_paths(&path, paths)?;
            continue;
        }

        if path.is_file() && is_supported_file(&path) {
            paths.push(path);
        }
    }

    Ok(())
}

fn read_documents(
    root: &Path,
    paths: &[PathBuf],
) -> Result<Vec<SourceDocument>, String> {
    let mut documents = Vec::new();

    for path in paths {
        let content = fs::read_to_string(path).map_err(|error| {
            format!("Failed to read file {}: {error}", path_to_string(path))
        })?;

        documents.push(SourceDocument {
    relative_path: relative_path_to_string(root, path),
    content,
    is_header: is_header_file(path),
});
    }

    Ok(documents)
}

fn is_supported_file(path: &Path) -> bool {
    is_source_file(path) || is_header_file(path)
}

fn read_dir_sorted(folder: &Path) -> Result<Vec<fs::DirEntry>, String> {
    let mut entries = Vec::new();

    for entry_result in fs::read_dir(folder).map_err(|error| {
        format!("Failed to read folder {}: {error}", path_to_string(folder))
    })? {
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