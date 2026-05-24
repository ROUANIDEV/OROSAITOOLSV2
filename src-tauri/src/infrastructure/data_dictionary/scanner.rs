use std::path::PathBuf;

use crate::domain::data_dictionary::DataDictionarySummary;

use super::parser::parse_documents;
use super::source_files::collect_source_documents;
use super::summary_builder::build_summary;

pub fn analyze_data_dictionary_folder(
    csc_path: &str,
) -> Result<DataDictionarySummary, String> {
    let root = validate_csc_path(csc_path)?;
    let documents = collect_source_documents(&root)?;
    let parsed = parse_documents(&documents)?;

    Ok(build_summary(
        &root,
        &documents,
        parsed,
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