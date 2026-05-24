use std::path::PathBuf;

use super::file_kind::FileKind;

#[derive(Debug, Clone)]
pub struct FileRecord {
    pub path: PathBuf,
    pub relative_path: String,
    pub file_type: String,
    pub size_bytes: u64,
    pub kind: FileKind,
}