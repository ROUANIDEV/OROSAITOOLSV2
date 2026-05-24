use std::path::Path;

use crate::domain::c_project::{
    CProjectScanSummary,
    ScannedFile,
};

use super::constants::{
    FILE_PREVIEW_LIMIT,
    IGNORED_DIRS,
};

use super::file_kind::FileKind;
use super::file_record::FileRecord;
use super::path_utils::path_to_string;

pub fn build_scan_summary(
    root: &Path,
    files: &[FileRecord],
) -> CProjectScanSummary {
    CProjectScanSummary {
        root_path: path_to_string(root),
        total_files: files.len(),
        c_files: count_by_kind(files, FileKind::Source),
        header_files: count_by_kind(files, FileKind::Header),
        assembly_files: count_by_kind(files, FileKind::Assembly),
        other_files: count_by_kind(files, FileKind::Other),
        total_size_bytes: files.iter().map(|file| file.size_bytes).sum(),
        ignored_directories: ignored_directories(),
        file_preview: build_file_preview(files),
    }
}

fn count_by_kind(files: &[FileRecord], kind: FileKind) -> usize {
    files.iter().filter(|file| file.kind == kind).count()
}

fn ignored_directories() -> Vec<String> {
    IGNORED_DIRS
        .iter()
        .map(|directory| directory.to_string())
        .collect()
}

fn build_file_preview(files: &[FileRecord]) -> Vec<ScannedFile> {
    files
        .iter()
        .take(FILE_PREVIEW_LIMIT)
        .map(|file| ScannedFile {
            path: path_to_string(&file.path),
            relative_path: file.relative_path.clone(),
            file_type: file.file_type.clone(),
            size_bytes: file.size_bytes,
        })
        .collect()
}