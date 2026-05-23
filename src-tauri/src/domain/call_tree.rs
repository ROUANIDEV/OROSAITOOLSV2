use regex::Regex;
use rust_xlsxwriter::{Format, Workbook, Worksheet};
use serde::Serialize;
use std::collections::{BTreeMap, BTreeSet};
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

const IGNORED_CALL_NAMES: &[&str] = &[
    "if",
    "else",
    "switch",
    "while",
    "for",
    "do",
    "sizeof",
    "return",
    "case",
    "break",
    "continue",
    "typedef",
    "struct",
    "enum",
    "union",
    "static",
    "const",
];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CallTreeSummary {
    pub root_path: String,
    pub source_files: usize,
    pub function_count: usize,
    pub call_count: usize,
    pub root_function_count: usize,

    pub root_functions: Vec<String>,

    // Frontend-friendly fields.
    pub functions: Vec<CallTreeFunction>,
    pub calls: Vec<CallTreeCall>,

    // Backward-compatible fields in case older UI/export code still reads them.
    pub function_preview: Vec<CallTreeFunction>,
    pub edges: Vec<CallTreeCall>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CallTreeExportResult {
    pub output_path: String,
    pub source_files: usize,
    pub function_count: usize,
    pub call_count: usize,
    pub root_function_count: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CallTreeFunction {
    pub name: String,
    pub function_name: String,

    pub file: String,
    pub file_path: String,
    pub relative_path: String,

    pub line: usize,
    pub calls_count: usize,
    pub called_by_count: usize,
    pub is_root: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CallTreeCall {
    pub caller: String,
    pub callee: String,

    // Backward-compatible names.
    pub calling_function: String,
    pub called_function: String,

    pub file: String,
    pub file_path: String,
    pub relative_path: String,

    pub line: usize,
}

#[derive(Debug, Clone)]
struct DetectedFunction {
    name: String,
    file_path: String,
    relative_path: String,
    line: usize,
    body_start_line: usize,
    body: String,
}

pub fn analyze_call_tree_folder(csc_path: &str) -> Result<CallTreeSummary, String> {
    let root = PathBuf::from(csc_path);

    if !root.exists() {
        return Err(format!("CSC path does not exist: {}", csc_path));
    }

    if !root.is_dir() {
        return Err(format!("CSC path is not a directory: {}", csc_path));
    }

    let mut source_files = Vec::new();
    collect_source_files(&root, &mut source_files)?;
    source_files.sort();

    let mut detected_functions = Vec::new();

    for source_file in &source_files {
        let content = fs::read_to_string(source_file).map_err(|err| {
            format!(
                "Failed to read source file {}: {}",
                path_to_string(source_file),
                err
            )
        })?;

        let relative_path = relative_path_to_string(&root, source_file);
        let mut functions = detect_functions_in_file(&content, source_file, &relative_path)?;
        detected_functions.append(&mut functions);
    }

    let known_function_names: BTreeSet<String> = detected_functions
        .iter()
        .map(|function| function.name.clone())
        .collect();

    let calls = detect_call_edges(&detected_functions)?;

    let mut calls_count_by_function: BTreeMap<String, usize> = BTreeMap::new();
    let mut called_by_count_by_function: BTreeMap<String, usize> = BTreeMap::new();

    for call in &calls {
        *calls_count_by_function
            .entry(call.caller.clone())
            .or_insert(0) += 1;

        if known_function_names.contains(&call.callee) {
            *called_by_count_by_function
                .entry(call.callee.clone())
                .or_insert(0) += 1;
        }
    }

    let called_defined_functions: BTreeSet<String> = called_by_count_by_function
        .keys()
        .cloned()
        .collect();

    let mut root_functions = known_function_names
        .difference(&called_defined_functions)
        .cloned()
        .collect::<Vec<String>>();

    root_functions.sort();

    let functions = detected_functions
        .iter()
        .map(|function| {
            let calls_count = calls_count_by_function
                .get(&function.name)
                .copied()
                .unwrap_or(0);

            let called_by_count = called_by_count_by_function
                .get(&function.name)
                .copied()
                .unwrap_or(0);

            CallTreeFunction {
                name: function.name.clone(),
                function_name: function.name.clone(),

                file: function.relative_path.clone(),
                file_path: function.file_path.clone(),
                relative_path: function.relative_path.clone(),

                line: function.line,
                calls_count,
                called_by_count,
                is_root: called_by_count == 0,
            }
        })
        .collect::<Vec<CallTreeFunction>>();

    let function_preview = functions.iter().take(100).cloned().collect::<Vec<_>>();

    Ok(CallTreeSummary {
        root_path: path_to_string(&root),
        source_files: source_files.len(),
        function_count: functions.len(),
        call_count: calls.len(),
        root_function_count: root_functions.len(),

        root_functions,

        functions,
        calls: calls.clone(),

        function_preview,
        edges: calls,
    })
}

pub fn export_call_tree_excel(csc_path: &str) -> Result<CallTreeExportResult, String> {
    let summary = analyze_call_tree_folder(csc_path)?;
    let root = PathBuf::from(csc_path);
    let output_path = root.join("call_tree.xlsx");

    let mut workbook = Workbook::new();
    let header_format = Format::new().set_bold();

    {
        let worksheet = workbook.add_worksheet();
        worksheet
            .set_name("Call Tree")
            .map_err(|err| format!("Failed to name Call Tree sheet: {}", err))?;

        write_header_row(
            worksheet,
            &header_format,
            &["Caller", "Callee", "File", "Line"],
        )?;

        for (index, call) in summary.calls.iter().enumerate() {
            let row = (index + 1) as u32;

            worksheet
                .write_string(row, 0, &call.caller)
                .map_err(|err| format!("Failed to write caller: {}", err))?;

            worksheet
                .write_string(row, 1, &call.callee)
                .map_err(|err| format!("Failed to write callee: {}", err))?;

            worksheet
                .write_string(row, 2, &call.relative_path)
                .map_err(|err| format!("Failed to write file path: {}", err))?;

            worksheet
                .write_string(row, 3, call.line.to_string())
                .map_err(|err| format!("Failed to write line: {}", err))?;
        }
    }

    {
        let worksheet = workbook.add_worksheet();
        worksheet
            .set_name("Functions")
            .map_err(|err| format!("Failed to name Functions sheet: {}", err))?;

        write_header_row(
            worksheet,
            &header_format,
            &[
                "Function",
                "File",
                "Line",
                "Calls Count",
                "Called By Count",
                "Is Root",
            ],
        )?;

        for (index, function) in summary.functions.iter().enumerate() {
            let row = (index + 1) as u32;

            worksheet
                .write_string(row, 0, &function.name)
                .map_err(|err| format!("Failed to write function name: {}", err))?;

            worksheet
                .write_string(row, 1, &function.relative_path)
                .map_err(|err| format!("Failed to write function file: {}", err))?;

            worksheet
                .write_string(row, 2, function.line.to_string())
                .map_err(|err| format!("Failed to write function line: {}", err))?;

            worksheet
                .write_string(row, 3, function.calls_count.to_string())
                .map_err(|err| format!("Failed to write calls count: {}", err))?;

            worksheet
                .write_string(row, 4, function.called_by_count.to_string())
                .map_err(|err| format!("Failed to write called by count: {}", err))?;

            worksheet
                .write_string(row, 5, function.is_root.to_string())
                .map_err(|err| format!("Failed to write root flag: {}", err))?;
        }
    }

    {
        let worksheet = workbook.add_worksheet();
        worksheet
            .set_name("Root Functions")
            .map_err(|err| format!("Failed to name Root Functions sheet: {}", err))?;

        write_header_row(worksheet, &header_format, &["Root Function"])?;

        for (index, root_function) in summary.root_functions.iter().enumerate() {
            let row = (index + 1) as u32;

            worksheet
                .write_string(row, 0, root_function)
                .map_err(|err| format!("Failed to write root function: {}", err))?;
        }
    }

    workbook
        .save(&output_path)
        .map_err(|err| format!("Failed to save call_tree.xlsx: {}", err))?;

    Ok(CallTreeExportResult {
        output_path: path_to_string(&output_path),
        source_files: summary.source_files,
        function_count: summary.function_count,
        call_count: summary.call_count,
        root_function_count: summary.root_function_count,
    })
}

fn write_header_row(
    worksheet: &mut Worksheet,
    header_format: &Format,
    headers: &[&str],
) -> Result<(), String> {
    for (column, header) in headers.iter().enumerate() {
        worksheet
            .write_string_with_format(0, column as u16, *header, header_format)
            .map_err(|err| format!("Failed to write Excel header: {}", err))?;
    }

    Ok(())
}

fn collect_source_files(folder: &Path, source_files: &mut Vec<PathBuf>) -> Result<(), String> {
    if should_ignore_dir(folder) {
        return Ok(());
    }

    let entries = read_dir_sorted(folder)?;

    for entry in entries {
        let path = entry.path();

        if path.is_dir() {
            collect_source_files(&path, source_files)?;
            continue;
        }

        if path.is_file() && is_source_file(&path) {
            source_files.push(path);
        }
    }

    Ok(())
}

fn detect_functions_in_file(
    content: &str,
    file_path: &Path,
    relative_path: &str,
) -> Result<Vec<DetectedFunction>, String> {
    let cleaned_content = strip_comments_preserve_layout(content);

    let function_regex = Regex::new(
        r"(?m)^[\t ]*(?:[A-Za-z_][A-Za-z0-9_]*[\w\s\*\(\),]*[\s\*]+)?(?P<name>[A-Za-z_][A-Za-z0-9_]*)\s*\([^;{}]*\)\s*\{",
    )
    .map_err(|err| format!("Failed to build function regex: {}", err))?;

    let mut functions = Vec::new();

    for captures in function_regex.captures_iter(&cleaned_content) {
        let Some(full_match) = captures.get(0) else {
            continue;
        };

        let Some(name_match) = captures.name("name") else {
            continue;
        };

        let function_name = name_match.as_str().to_string();

        if is_ignored_call_name(&function_name) {
            continue;
        }

        let open_brace_index = full_match.end().saturating_sub(1);

        let Some(close_brace_index) = find_matching_brace(&cleaned_content, open_brace_index) else {
            continue;
        };

        let body = cleaned_content[full_match.end()..close_brace_index].to_string();
        let line = line_number_at(content, full_match.start());
        let body_start_line = line_number_at(content, full_match.end());

        functions.push(DetectedFunction {
            name: function_name,
            file_path: path_to_string(file_path),
            relative_path: relative_path.to_string(),
            line,
            body_start_line,
            body,
        });
    }

    Ok(functions)
}

fn detect_call_edges(functions: &[DetectedFunction]) -> Result<Vec<CallTreeCall>, String> {
    let call_regex = Regex::new(r"\b(?P<name>[A-Za-z_][A-Za-z0-9_]*)\s*\(")
        .map_err(|err| format!("Failed to build call regex: {}", err))?;

    let mut calls = Vec::new();

    for function in functions {
        let mut calls_in_function: BTreeMap<String, usize> = BTreeMap::new();

        for captures in call_regex.captures_iter(&function.body) {
            let Some(full_match) = captures.get(0) else {
                continue;
            };

            let Some(name_match) = captures.name("name") else {
                continue;
            };

            let called_function = name_match.as_str().to_string();

            if is_ignored_call_name(&called_function) {
                continue;
            }

            let call_line =
                function.body_start_line + line_number_at(&function.body, full_match.start()) - 1;

            calls_in_function
                .entry(called_function)
                .or_insert(call_line);
        }

        for (called_function, call_line) in calls_in_function {
            calls.push(CallTreeCall {
                caller: function.name.clone(),
                callee: called_function.clone(),

                calling_function: function.name.clone(),
                called_function,

                file: function.relative_path.clone(),
                file_path: function.file_path.clone(),
                relative_path: function.relative_path.clone(),

                line: call_line,
            });
        }
    }

    calls.sort_by(|a, b| {
        a.caller
            .cmp(&b.caller)
            .then(a.callee.cmp(&b.callee))
            .then(a.relative_path.cmp(&b.relative_path))
            .then(a.line.cmp(&b.line))
    });

    Ok(calls)
}

fn find_matching_brace(content: &str, open_brace_index: usize) -> Option<usize> {
    let bytes = content.as_bytes();

    if bytes.get(open_brace_index) != Some(&b'{') {
        return None;
    }

    let mut depth = 0usize;

    for (index, byte) in bytes.iter().enumerate().skip(open_brace_index) {
        match byte {
            b'{' => depth += 1,
            b'}' => {
                depth = depth.saturating_sub(1);

                if depth == 0 {
                    return Some(index);
                }
            }
            _ => {}
        }
    }

    None
}

fn strip_comments_preserve_layout(content: &str) -> String {
    let bytes = content.as_bytes();
    let mut result = Vec::with_capacity(bytes.len());

    let mut index = 0usize;

    while index < bytes.len() {
        let current = bytes[index];
        let next = bytes.get(index + 1).copied();

        if current == b'/' && next == Some(b'/') {
            result.push(b' ');
            result.push(b' ');
            index += 2;

            while index < bytes.len() && bytes[index] != b'\n' {
                result.push(b' ');
                index += 1;
            }

            if index < bytes.len() {
                result.push(bytes[index]);
                index += 1;
            }

            continue;
        }

        if current == b'/' && next == Some(b'*') {
            result.push(b' ');
            result.push(b' ');
            index += 2;

            while index + 1 < bytes.len() {
                if bytes[index] == b'*' && bytes[index + 1] == b'/' {
                    result.push(b' ');
                    result.push(b' ');
                    index += 2;
                    break;
                }

                if bytes[index] == b'\n' {
                    result.push(b'\n');
                } else {
                    result.push(b' ');
                }

                index += 1;
            }

            continue;
        }

        result.push(current);
        index += 1;
    }

    String::from_utf8_lossy(&result).to_string()
}

fn read_dir_sorted(folder: &Path) -> Result<Vec<fs::DirEntry>, String> {
    let read_dir = fs::read_dir(folder)
        .map_err(|err| format!("Failed to read folder {}: {}", path_to_string(folder), err))?;

    let mut entries: Vec<fs::DirEntry> = Vec::new();

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

fn is_source_file(path: &Path) -> bool {
    let extension = extension_lowercase(path);
    SOURCE_EXTENSIONS.contains(&extension.as_str())
}

fn should_ignore_dir(path: &Path) -> bool {
    let folder_name = file_name_lowercase(path);
    IGNORED_DIRS.contains(&folder_name.as_str())
}

fn is_ignored_call_name(name: &str) -> bool {
    IGNORED_CALL_NAMES.contains(&name)
}

fn line_number_at(content: &str, byte_index: usize) -> usize {
    content
        .as_bytes()
        .iter()
        .take(byte_index.min(content.len()))
        .filter(|byte| **byte == b'\n')
        .count()
        + 1
}

fn file_name_lowercase(path: &Path) -> String {
    path.file_name()
        .map(|value| value.to_string_lossy().to_lowercase())
        .unwrap_or_default()
}

fn extension_lowercase(path: &Path) -> String {
    path.extension()
        .map(|value| value.to_string_lossy().to_lowercase())
        .unwrap_or_default()
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().to_string()
}

fn relative_path_to_string(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .map(path_to_string)
        .unwrap_or_else(|_| path_to_string(path))
}