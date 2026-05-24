use std::fs;
use std::path::Path;

use regex::Regex;

use super::brace_matcher::find_matching_brace;
use super::comments::strip_comments_preserve_layout;
use super::constants::IGNORED_CALL_NAMES;
use super::detected_function::DetectedFunction;

use super::path_utils::{
    path_to_string,
    relative_path_to_string,
};

pub fn detect_functions_in_file(
    root: &Path,
    source_file: &Path,
) -> Result<Vec<DetectedFunction>, String> {
    let content = fs::read_to_string(source_file).map_err(|error| {
        format!(
            "Failed to read source file {}: {error}",
            path_to_string(source_file)
        )
    })?;

    let relative_path = relative_path_to_string(root, source_file);

    parse_functions(
        &content,
        source_file,
        &relative_path,
    )
}

fn parse_functions(
    content: &str,
    file_path: &Path,
    relative_path: &str,
) -> Result<Vec<DetectedFunction>, String> {
    let cleaned_content = strip_comments_preserve_layout(content);
    let function_regex = build_function_regex()?;
    let mut functions = Vec::new();

    for captures in function_regex.captures_iter(&cleaned_content) {
        if let Some(function) = parse_function_capture(
            content,
            &cleaned_content,
            file_path,
            relative_path,
            &captures,
        ) {
            functions.push(function);
        }
    }

    Ok(functions)
}

fn build_function_regex() -> Result<Regex, String> {
    Regex::new(
        r"(?m)^[\t ]*(?:[A-Za-z_][A-Za-z0-9_]*[\w\s\*\(\),]*[\s\*]+)?(?P<name>[A-Za-z_][A-Za-z0-9_]*)\s*\([^;{}]*\)\s*\{",
    )
    .map_err(|error| format!("Failed to build function regex: {error}"))
}

fn parse_function_capture(
    content: &str,
    cleaned_content: &str,
    file_path: &Path,
    relative_path: &str,
    captures: &regex::Captures,
) -> Option<DetectedFunction> {
    let full_match = captures.get(0)?;
    let name_match = captures.name("name")?;
    let function_name = name_match.as_str().to_string();

    if is_ignored_call_name(&function_name) {
        return None;
    }

    let open_brace_index = full_match.end().saturating_sub(1);
    let close_brace_index = find_matching_brace(
        cleaned_content,
        open_brace_index,
    )?;

    Some(DetectedFunction {
        name: function_name,
        file_path: path_to_string(file_path),
        relative_path: relative_path.to_string(),
        line: line_number_at(content, full_match.start()),
        body_start_line: line_number_at(content, full_match.end()),
        body: cleaned_content[full_match.end()..close_brace_index].to_string(),
    })
}

pub fn is_ignored_call_name(name: &str) -> bool {
    IGNORED_CALL_NAMES.contains(&name)
}

pub fn line_number_at(content: &str, byte_index: usize) -> usize {
    content
        .as_bytes()
        .iter()
        .take(byte_index.min(content.len()))
        .filter(|byte| **byte == b'\n')
        .count()
        + 1
}