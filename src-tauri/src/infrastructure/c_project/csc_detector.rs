use std::path::{Path, PathBuf};

use crate::domain::c_project::CscFolder;

use super::constants::{
    INCLUDE_FOLDER_NAMES,
    SOURCE_FOLDER_NAMES,
};

use super::file_kind::FileKind;
use super::file_record::FileRecord;

use super::path_utils::{
    file_name_lowercase,
    file_name_to_string,
    path_to_string,
    relative_path_to_string,
};

pub fn detect_csc_folders(
    root: &Path,
    directories: &[PathBuf],
    files: &[FileRecord],
) -> Vec<CscFolder> {
    let mut candidates = vec![root.to_path_buf()];
    candidates.extend(directories.iter().cloned());

    let mut folders = candidates
        .into_iter()
        .filter_map(|candidate| build_csc_folder(root, &candidate, directories, files))
        .collect::<Vec<_>>();

    if folders.is_empty() {
        add_root_fallback(root, files, &mut folders);
    }

    folders.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
    folders
}

fn build_csc_folder(
    root: &Path,
    candidate: &Path,
    directories: &[PathBuf],
    files: &[FileRecord],
) -> Option<CscFolder> {
    let sources_path = find_direct_child_dir(candidate, directories, SOURCE_FOLDER_NAMES);
    let include_path = find_direct_child_dir(candidate, directories, INCLUDE_FOLDER_NAMES);

    if !has_csc_shape(candidate, &sources_path, &include_path) {
        return None;
    }

    let c_files = count_files(candidate, files, FileKind::Source);
    let header_files = count_files(candidate, files, FileKind::Header);

    if c_files + header_files == 0 {
        return None;
    }

    Some(CscFolder {
        name: file_name_to_string(candidate),
        path: path_to_string(candidate),
        relative_path: relative_path_to_string(root, candidate),
        sources_path: sources_path.as_ref().map(|path| path_to_string(path)),
        include_path: include_path.as_ref().map(|path| path_to_string(path)),
        c_files,
        header_files,
    })
}

fn has_csc_shape(
    candidate: &Path,
    sources_path: &Option<PathBuf>,
    include_path: &Option<PathBuf>,
) -> bool {
    let name = file_name_lowercase(candidate);

    sources_path.is_some()
        || include_path.is_some()
        || name == "csc"
        || name.starts_with("csc_")
        || name.ends_with("_csc")
        || name.contains("csc")
}

fn find_direct_child_dir(
    parent: &Path,
    directories: &[PathBuf],
    wanted_names: &[&str],
) -> Option<PathBuf> {
    directories
        .iter()
        .find(|directory| is_wanted_child(parent, directory, wanted_names))
        .cloned()
}

fn is_wanted_child(
    parent: &Path,
    directory: &Path,
    wanted_names: &[&str],
) -> bool {
    let Some(directory_parent) = directory.parent() else {
        return false;
    };

    directory_parent == parent
        && wanted_names
            .iter()
            .any(|wanted_name| *wanted_name == file_name_lowercase(directory))
}

fn count_files(candidate: &Path, files: &[FileRecord], kind: FileKind) -> usize {
    files
        .iter()
        .filter(|file| file.path.starts_with(candidate))
        .filter(|file| file.kind == kind)
        .count()
}

fn add_root_fallback(
    root: &Path,
    files: &[FileRecord],
    folders: &mut Vec<CscFolder>,
) {
    let c_files = count_files(root, files, FileKind::Source);
    let header_files = count_files(root, files, FileKind::Header);

    if c_files + header_files == 0 {
        return;
    }

    folders.push(CscFolder {
        name: file_name_to_string(root),
        path: path_to_string(root),
        relative_path: ".".to_string(),
        sources_path: None,
        include_path: None,
        c_files,
        header_files,
    });
}