use std::path::{Path, PathBuf};

use crate::domain::call_tree::CallTreeSummary;

use super::call_detector::detect_call_edges;
use super::detected_function::DetectedFunction;
use super::function_parser::detect_functions_in_file;
use super::source_files::collect_source_files;
use super::summary_builder::build_summary;

pub fn analyze_call_tree_folder(
    csc_path: &str,
) -> Result<CallTreeSummary, String> {
    let root = validate_csc_path(csc_path)?;
    let source_files = collect_source_files(&root)?;
    let functions = detect_all_functions(&root, &source_files)?;
    let calls = detect_call_edges(&functions)?;

    Ok(build_summary(
        &root,
        source_files.len(),
        &functions,
        calls,
    ))
}

fn validate_csc_path(csc_path: &str) -> Result<PathBuf, String> {
    let root = PathBuf::from(csc_path);

    if !root.exists() {
        return Err(format!("CSC path does not exist: {csc_path}"));
    }

    if !root.is_dir() {
        return Err(format!("CSC path is not a directory: {csc_path}"));
    }

    Ok(root)
}

fn detect_all_functions(
    root: &Path,
    source_files: &[PathBuf],
) -> Result<Vec<DetectedFunction>, String> {
    let mut functions = Vec::new();

    for source_file in source_files {
        let mut file_functions = detect_functions_in_file(root, source_file)?;
        functions.append(&mut file_functions);
    }

    Ok(functions)
}