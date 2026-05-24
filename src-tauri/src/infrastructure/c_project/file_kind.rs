use std::path::Path;

use super::constants::{
    ASSEMBLY_EXTENSIONS,
    HEADER_EXTENSIONS,
    SOURCE_EXTENSIONS,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FileKind {
    Source,
    Header,
    Assembly,
    Other,
}

pub fn classify_file_kind(path: &Path) -> FileKind {
    let extension = extension_lowercase(path);

    if SOURCE_EXTENSIONS.contains(&extension.as_str()) {
        return FileKind::Source;
    }

    if HEADER_EXTENSIONS.contains(&extension.as_str()) {
        return FileKind::Header;
    }

    if ASSEMBLY_EXTENSIONS.contains(&extension.as_str()) {
        return FileKind::Assembly;
    }

    FileKind::Other
}

pub fn file_kind_to_label(kind: FileKind) -> &'static str {
    match kind {
        FileKind::Source => "C/C++ source",
        FileKind::Header => "Header",
        FileKind::Assembly => "Assembly",
        FileKind::Other => "Other",
    }
}

fn extension_lowercase(path: &Path) -> String {
    path.extension()
        .map(|value| value.to_string_lossy().to_lowercase())
        .unwrap_or_default()
}