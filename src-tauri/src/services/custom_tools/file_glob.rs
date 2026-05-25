use regex::Regex;
use std::{
    fs,
    path::{Path, PathBuf},
};

use crate::domain::custom_tools::{
    CustomToolFileGlobMatch, CustomToolFileGlobResult,
};

const DEFAULT_MAX_RESULTS: usize = 200;
const HARD_MAX_RESULTS: usize = 1_000;

pub async fn scan_files(
    root_path: String,
    pattern: String,
    max_results: Option<usize>,
) -> Result<CustomToolFileGlobResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        scan_files_sync(root_path, pattern, max_results)
    })
    .await
    .map_err(|error| error.to_string())?
}

fn scan_files_sync(
    root_path: String,
    pattern: String,
    max_results: Option<usize>,
) -> Result<CustomToolFileGlobResult, String> {
    let cleaned_root = clean_user_path(&root_path);

    if cleaned_root.is_empty() {
        return Err("Choose a folder before running file search.".to_string());
    }

    let root = PathBuf::from(&cleaned_root);

    if !root.exists() {
        return Err(format!("Folder does not exist: {cleaned_root}"));
    }

    if !root.is_dir() {
        return Err(format!("Path is not a folder: {cleaned_root}"));
    }

    let normalized_pattern = normalize_pattern(&pattern);
    let matcher = PatternMatcher::new(&normalized_pattern)?;
    let limit = max_results
        .unwrap_or(DEFAULT_MAX_RESULTS)
        .min(HARD_MAX_RESULTS);

    let mut files = Vec::new();
    let mut matched_count = 0;

    walk_directory(
        &root,
        &root,
        &matcher,
        limit,
        &mut matched_count,
        &mut files,
    )?;

    files.sort_by(|left, right| left.relative_path.cmp(&right.relative_path));

    Ok(CustomToolFileGlobResult {
        root_path: normalize_path(&root),
        pattern: normalized_pattern,
        returned_count: files.len(),
        truncated: matched_count > files.len(),
        matched_count,
        files,
    })
}

fn walk_directory(
    root: &Path,
    current: &Path,
    matcher: &PatternMatcher,
    limit: usize,
    matched_count: &mut usize,
    files: &mut Vec<CustomToolFileGlobMatch>,
) -> Result<(), String> {
    let entries = fs::read_dir(current)
        .map_err(|error| format!("Unable to scan {}: {error}", normalize_path(current)))?;

    for entry_result in entries {
        let entry = entry_result.map_err(|error| error.to_string())?;
        let path = entry.path();
        let file_type = entry.file_type().map_err(|error| error.to_string())?;

        if file_type.is_dir() {
            walk_directory(root, &path, matcher, limit, matched_count, files)?;
            continue;
        }

        if !file_type.is_file() {
            continue;
        }

        let relative_path = relative_path(root, &path);
        let file_name = path
            .file_name()
            .map(|name| name.to_string_lossy().to_string())
            .unwrap_or_default();

        if !matcher.is_match(&relative_path, &file_name) {
            continue;
        }

        *matched_count += 1;

        if files.len() < limit {
            files.push(CustomToolFileGlobMatch {
                path: normalize_path(&path),
                relative_path,
            });
        }
    }

    Ok(())
}

struct PatternMatcher {
    regex: Regex,
    can_match_file_name: bool,
}

impl PatternMatcher {
    fn new(pattern: &str) -> Result<Self, String> {
        let regex = Regex::new(&glob_to_regex_source(pattern))
            .map_err(|error| format!("Invalid glob pattern: {error}"))?;

        Ok(Self {
            regex,
            can_match_file_name: !pattern.contains('/'),
        })
    }

    fn is_match(&self, relative_path: &str, file_name: &str) -> bool {
        self.regex.is_match(relative_path)
            || (self.can_match_file_name && self.regex.is_match(file_name))
    }
}

fn glob_to_regex_source(pattern: &str) -> String {
    let chars: Vec<char> = pattern.chars().collect();
    let mut index = 0;
    let mut source = String::from("^");

    while index < chars.len() {
        let current = chars[index];

        if current == '*' && chars.get(index + 1) == Some(&'*') {
            if chars.get(index + 2) == Some(&'/') {
                source.push_str("(?:.*/)?");
                index += 3;
            } else {
                source.push_str(".*");
                index += 2;
            }
            continue;
        }

        if current == '*' {
            source.push_str("[^/]*");
        } else if current == '?' {
            source.push_str("[^/]");
        } else {
            source.push_str(&regex::escape(&current.to_string()));
        }

        index += 1;
    }

    source.push('$');
    source
}

fn clean_user_path(raw_path: &str) -> String {
    raw_path
        .trim()
        .trim_matches('"')
        .trim_matches('\'')
        .trim()
        .to_string()
}

fn normalize_pattern(raw_pattern: &str) -> String {
    let mut pattern = raw_pattern.trim().replace('\\', "/");

    while pattern.starts_with("./") {
        pattern = pattern[2..].to_string();
    }

    while pattern.starts_with('/') {
        pattern = pattern[1..].to_string();
    }

    if pattern.is_empty() {
        "**/*".to_string()
    } else {
        pattern
    }
}

fn normalize_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

fn relative_path(root: &Path, path: &Path) -> String {
    normalize_path(path.strip_prefix(root).unwrap_or(path))
}