use std::path::Path;

use super::constants::{
    HEADER_EXTENSIONS,
    IGNORED_DIRS,
    SOURCE_EXTENSIONS,
};

pub fn should_ignore_dir(path: &Path) -> bool {
    let folder_name = file_name_lowercase(path);
    IGNORED_DIRS.contains(&folder_name.as_str())
}

pub fn is_source_file(path: &Path) -> bool {
    let extension = extension_lowercase(path);
    SOURCE_EXTENSIONS.contains(&extension.as_str())
}

pub fn is_header_file(path: &Path) -> bool {
    let extension = extension_lowercase(path);
    HEADER_EXTENSIONS.contains(&extension.as_str())
}

pub fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().to_string()
}

pub fn relative_path_to_string(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .map(path_to_string)
        .unwrap_or_else(|_| path_to_string(path))
}

fn file_name_lowercase(path: &Path) -> String {
    path.file_name()
        .map(|value| value.to_string_lossy().to_lowercase())
        .unwrap_or_default()
}

fn extension_lowercase(path: &Path) -> String {
    path.extension()
        .map(|value| value.to_string_lossy().to_lowercase())
        .unwrap_or_default()
}