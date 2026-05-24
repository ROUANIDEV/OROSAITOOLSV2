use std::path::Path;

use crate::domain::data_dictionary::DataDictionarySummary;

use super::models::{
    ParsedDictionary,
    SourceDocument,
};

use super::path_utils::path_to_string;

use super::summary_items::{
    build_constants,
    build_data_types,
    build_global_variables,
};

pub fn build_summary(
    root: &Path,
    documents: &[SourceDocument],
    parsed: ParsedDictionary,
) -> DataDictionarySummary {
    DataDictionarySummary {
        root_path: path_to_string(root),
        source_files: count_source_files(documents),
        header_files: count_header_files(documents),
        constants_count: parsed.constants.len(),
        global_variables_count: parsed.global_variables.len(),
        data_types_count: parsed.data_types.len(),
        constants: build_constants(documents, parsed.constants),
        global_variables: build_global_variables(
            documents,
            parsed.global_variables,
        ),
        data_types: build_data_types(documents, parsed.data_types),
    }
}

fn count_source_files(documents: &[SourceDocument]) -> usize {
    documents
        .iter()
        .filter(|document| !document.is_header)
        .count()
}

fn count_header_files(documents: &[SourceDocument]) -> usize {
    documents
        .iter()
        .filter(|document| document.is_header)
        .count()
}