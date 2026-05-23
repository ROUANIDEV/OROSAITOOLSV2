use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

const IGNORED_DIRS: &[&str] = &[
    ".git",
    ".svn",
    ".hg",
    "node_modules",
    "target",
    "dist",
    "build",
    ".vscode",
    ".idea",
];

const SOURCE_EXTENSIONS: &[&str] = &["c", "cpp", "cc", "cxx"];
const HEADER_EXTENSIONS: &[&str] = &["h", "hpp", "hh", "hxx"];
const ASSEMBLY_EXTENSIONS: &[&str] = &["s", "asm"];

const SOURCE_FOLDER_NAMES: &[&str] = &["src", "source", "sources"];
const INCLUDE_FOLDER_NAMES: &[&str] = &["inc", "include", "includes"];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum FileKind {
    Source,
    Header,
    Assembly,
    Other,
}

#[derive(Debug, Clone)]
struct FileRecord {
    path: PathBuf,
    relative_path: String,
    file_type: String,
    size_bytes: u64,
    kind: FileKind,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CscFolder {
    pub name: String,
    pub path: String,
    pub relative_path: String,
    pub sources_path: Option<String>,
    pub include_path: Option<String>,
    pub c_files: usize,
    pub header_files: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannedFile {
    pub path: String,
    pub relative_path: String,
    pub file_type: String,
    pub size_bytes: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CProjectScanSummary {
    pub root_path: String,
    pub total_files: usize,
    pub c_files: usize,
    pub header_files: usize,
    pub assembly_files: usize,
    pub other_files: usize,
    pub total_size_bytes: u64,
    pub ignored_directories: Vec<String>,
    pub file_preview: Vec<ScannedFile>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CProjectWorkspaceScanResult {
    pub summary: CProjectScanSummary,
    pub csc_folders: Vec<CscFolder>,
}

pub fn scan_c_project_workspace_blocking(
    project_path: &str,
) -> Result<CProjectWorkspaceScanResult, String> {
    let root = PathBuf::from(project_path);

    if !root.exists() {
        return Err(format!("Project path does not exist: {}", project_path));
    }

    if !root.is_dir() {
        return Err(format!("Project path is not a directory: {}", project_path));
    }

    let mut directories = Vec::new();
    let mut files = Vec::new();

    walk_project(&root, &root, &mut directories, &mut files)?;

    files.sort_by(|a, b| a.path.cmp(&b.path));
    directories.sort();

    let total_files = files.len();

    let c_files = files
        .iter()
        .filter(|file| file.kind == FileKind::Source)
        .count();

    let header_files = files
        .iter()
        .filter(|file| file.kind == FileKind::Header)
        .count();

    let assembly_files = files
        .iter()
        .filter(|file| file.kind == FileKind::Assembly)
        .count();

    let other_files = files
        .iter()
        .filter(|file| file.kind == FileKind::Other)
        .count();

    let total_size_bytes = files.iter().map(|file| file.size_bytes).sum();

    let file_preview = files
        .iter()
        .take(200)
        .map(|file| ScannedFile {
            path: path_to_string(&file.path),
            relative_path: file.relative_path.clone(),
            file_type: file.file_type.clone(),
            size_bytes: file.size_bytes,
        })
        .collect();

    let summary = CProjectScanSummary {
        root_path: path_to_string(&root),
        total_files,
        c_files,
        header_files,
        assembly_files,
        other_files,
        total_size_bytes,
        ignored_directories: IGNORED_DIRS.iter().map(|value| value.to_string()).collect(),
        file_preview,
    };

    let csc_folders = detect_csc_folders(&root, &directories, &files);

    Ok(CProjectWorkspaceScanResult {
        summary,
        csc_folders,
    })
}

pub fn scan_c_project_blocking(project_path: &str) -> Result<CProjectScanSummary, String> {
    let result = scan_c_project_workspace_blocking(project_path)?;
    Ok(result.summary)
}

pub fn list_csc_folders_blocking(project_path: &str) -> Result<Vec<CscFolder>, String> {
    let result = scan_c_project_workspace_blocking(project_path)?;
    Ok(result.csc_folders)
}

fn walk_project(
    root: &Path,
    folder: &Path,
    directories: &mut Vec<PathBuf>,
    files: &mut Vec<FileRecord>,
) -> Result<(), String> {
    let entries = read_dir_sorted(folder)?;

    for entry in entries {
        let path = entry.path();

        if path.is_dir() {
            if should_ignore_dir(&path) {
                continue;
            }

            directories.push(path.clone());
            walk_project(root, &path, directories, files)?;
            continue;
        }

        if !path.is_file() {
            continue;
        }

        let metadata = fs::metadata(&path).map_err(|err| {
            format!(
                "Failed to read file metadata for {}: {}",
                path_to_string(&path),
                err
            )
        })?;

        let kind = classify_file_kind(&path);

        files.push(FileRecord {
            relative_path: relative_path_to_string(root, &path),
            file_type: file_kind_to_label(kind).to_string(),
            size_bytes: metadata.len(),
            kind,
            path,
        });
    }

    Ok(())
}

fn detect_csc_folders(
    root: &Path,
    directories: &[PathBuf],
    files: &[FileRecord],
) -> Vec<CscFolder> {
    let mut candidate_paths = Vec::new();

    candidate_paths.push(root.to_path_buf());
    candidate_paths.extend(directories.iter().cloned());

    let mut csc_folders = Vec::new();

    for candidate_path in candidate_paths {
        let sources_path = find_direct_child_dir(&candidate_path, directories, SOURCE_FOLDER_NAMES);
        let include_path = find_direct_child_dir(&candidate_path, directories, INCLUDE_FOLDER_NAMES);

        let candidate_name = file_name_lowercase(&candidate_path);

        let looks_like_csc = candidate_name == "csc"
            || candidate_name.starts_with("csc_")
            || candidate_name.ends_with("_csc")
            || candidate_name.contains("csc");

        let has_csc_shape = sources_path.is_some() || include_path.is_some() || looks_like_csc;

        if !has_csc_shape {
            continue;
        }

        let c_files = files
            .iter()
            .filter(|file| file.path.starts_with(&candidate_path))
            .filter(|file| file.kind == FileKind::Source)
            .count();

        let header_files = files
            .iter()
            .filter(|file| file.path.starts_with(&candidate_path))
            .filter(|file| file.kind == FileKind::Header)
            .count();

        if c_files + header_files == 0 {
            continue;
        }

        csc_folders.push(CscFolder {
            name: file_name_to_string(&candidate_path),
            path: path_to_string(&candidate_path),
            relative_path: relative_path_to_string(root, &candidate_path),
            sources_path: sources_path.as_ref().map(|path| path_to_string(path)),
            include_path: include_path.as_ref().map(|path| path_to_string(path)),
            c_files,
            header_files,
        });
    }

    if csc_folders.is_empty() {
        let c_files = files
            .iter()
            .filter(|file| file.kind == FileKind::Source)
            .count();

        let header_files = files
            .iter()
            .filter(|file| file.kind == FileKind::Header)
            .count();

        if c_files + header_files > 0 {
            csc_folders.push(CscFolder {
                name: file_name_to_string(root),
                path: path_to_string(root),
                relative_path: ".".to_string(),
                sources_path: None,
                include_path: None,
                c_files,
                header_files,
            });
        }
    }

    csc_folders.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));

    csc_folders
}

fn find_direct_child_dir(
    parent: &Path,
    directories: &[PathBuf],
    wanted_names: &[&str],
) -> Option<PathBuf> {
    directories
        .iter()
        .find(|directory| {
            let Some(directory_parent) = directory.parent() else {
                return false;
            };

            if directory_parent != parent {
                return false;
            }

            let name = file_name_lowercase(directory);
            wanted_names.iter().any(|wanted_name| *wanted_name == name)
        })
        .cloned()
}

fn read_dir_sorted(folder: &Path) -> Result<Vec<fs::DirEntry>, String> {
    let read_dir = fs::read_dir(folder)
        .map_err(|err| format!("Failed to read folder {}: {}", path_to_string(folder), err))?;

    let mut entries = Vec::new();

    for entry_result in read_dir {
        let entry = entry_result.map_err(|err| {
            format!(
                "Failed to read folder entry in {}: {}",
                path_to_string(folder),
                err
            )
        })?;

        entries.push(entry);
    }

    entries.sort_by_key(|entry| entry.path());

    Ok(entries)
}

fn classify_file_kind(path: &Path) -> FileKind {
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

fn file_kind_to_label(kind: FileKind) -> &'static str {
    match kind {
        FileKind::Source => "C/C++ source",
        FileKind::Header => "Header",
        FileKind::Assembly => "Assembly",
        FileKind::Other => "Other",
    }
}

fn should_ignore_dir(path: &Path) -> bool {
    let folder_name = file_name_lowercase(path);
    IGNORED_DIRS.contains(&folder_name.as_str())
}

fn extension_lowercase(path: &Path) -> String {
    path.extension()
        .map(|value| value.to_string_lossy().to_lowercase())
        .unwrap_or_default()
}

fn file_name_lowercase(path: &Path) -> String {
    path.file_name()
        .map(|value| value.to_string_lossy().to_lowercase())
        .unwrap_or_default()
}

fn file_name_to_string(path: &Path) -> String {
    path.file_name()
        .map(|value| value.to_string_lossy().to_string())
        .unwrap_or_else(|| path_to_string(path))
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().to_string()
}

fn relative_path_to_string(root: &Path, path: &Path) -> String {
    if root == path {
        return ".".to_string();
    }

    path.strip_prefix(root)
        .map(path_to_string)
        .unwrap_or_else(|_| path_to_string(path))
}