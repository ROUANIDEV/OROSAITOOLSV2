use std::path::Path;

use super::constants::IGNORED_DIRS;

pub fn should_ignore_dir(path: &Path) -> bool {
    let folder_name = file_name_lowercase(path);
    IGNORED_DIRS.contains(&folder_name.as_str())
}

pub fn file_name_lowercase(path: &Path) -> String {
    path.file_name()
        .map(|value| value.to_string_lossy().to_lowercase())
        .unwrap_or_default()
}

pub fn file_name_to_string(path: &Path) -> String {
    path.file_name()
        .map(|value| value.to_string_lossy().to_string())
        .unwrap_or_else(|| path_to_string(path))
}

pub fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().to_string()
}

pub fn relative_path_to_string(root: &Path, path: &Path) -> String {
    if root == path {
        return ".".to_string();
    }

    path.strip_prefix(root)
        .map(path_to_string)
        .unwrap_or_else(|_| path_to_string(path))
}