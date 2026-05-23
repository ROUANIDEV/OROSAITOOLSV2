use regex::Regex;
use rust_xlsxwriter::{Format, Workbook, Worksheet};
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum CodeFileKind {
    Source,
    Header,
}

#[derive(Debug, Clone)]
struct CodeFile {
    path: PathBuf,
    kind: CodeFileKind,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DataDictionarySummary {
    pub root_path: String,
    pub source_files: usize,
    pub header_files: usize,
    pub constants_count: usize,
    pub global_variables_count: usize,
    pub data_types_count: usize,
    pub constants: Vec<ConstantItem>,
    pub global_variables: Vec<GlobalVariableItem>,
    pub data_types: Vec<DataTypeItem>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DataDictionaryExportResult {
    pub output_path: String,
    pub source_files: usize,
    pub header_files: usize,
    pub constants_count: usize,
    pub global_variables_count: usize,
    pub data_types_count: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConstantItem {
    pub name: String,
    pub kind: String,
    pub value: String,
    pub relative_path: String,
    pub line: usize,
    pub used_in_sources: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalVariableItem {
    pub name: String,
    pub data_type: String,
    pub dimensions: String,
    pub initializer: String,
    pub relative_path: String,
    pub line: usize,
    pub used_in_sources: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DataTypeItem {
    pub name: String,
    pub kind: String,
    pub definition: String,
    pub relative_path: String,
    pub line: usize,
    pub used_in_sources: bool,
}

pub fn analyze_data_dictionary_folder(csc_path: &str) -> Result<DataDictionarySummary, String> {
    let root = PathBuf::from(csc_path);

    if !root.exists() {
        return Err(format!("CSC path does not exist: {}", csc_path));
    }

    if !root.is_dir() {
        return Err(format!("CSC path is not a directory: {}", csc_path));
    }

    let mut code_files = Vec::new();
    collect_code_files(&root, &mut code_files)?;
    code_files.sort_by(|a, b| a.path.cmp(&b.path));

    let source_files = code_files
        .iter()
        .filter(|file| file.kind == CodeFileKind::Source)
        .count();

    let header_files = code_files
        .iter()
        .filter(|file| file.kind == CodeFileKind::Header)
        .count();

    let source_search_text = build_source_search_text(&code_files)?;

    let mut constants = Vec::new();
    let mut global_variables = Vec::new();
    let mut data_types = Vec::new();

    for code_file in &code_files {
        let content = fs::read_to_string(&code_file.path).map_err(|err| {
            format!(
                "Failed to read code file {}: {}",
                path_to_string(&code_file.path),
                err
            )
        })?;

        let cleaned_content = strip_comments_preserve_layout(&content);
        let relative_path = relative_path_to_string(&root, &code_file.path);

        let mut file_constants =
            extract_define_constants(&cleaned_content, &relative_path, &source_search_text)?;
        constants.append(&mut file_constants);

        let mut file_global_variables =
            extract_global_variables(&cleaned_content, &relative_path, &source_search_text)?;
        global_variables.append(&mut file_global_variables);

        let mut file_data_types =
            extract_data_types(&cleaned_content, &relative_path, &source_search_text)?;
        data_types.append(&mut file_data_types);
    }

    constants.sort_by(|a, b| {
        a.relative_path
            .cmp(&b.relative_path)
            .then(a.line.cmp(&b.line))
            .then(a.name.cmp(&b.name))
    });

    global_variables.sort_by(|a, b| {
        a.relative_path
            .cmp(&b.relative_path)
            .then(a.line.cmp(&b.line))
            .then(a.name.cmp(&b.name))
    });

    data_types.sort_by(|a, b| {
        a.relative_path
            .cmp(&b.relative_path)
            .then(a.line.cmp(&b.line))
            .then(a.name.cmp(&b.name))
    });

    Ok(DataDictionarySummary {
        root_path: path_to_string(&root),
        source_files,
        header_files,
        constants_count: constants.len(),
        global_variables_count: global_variables.len(),
        data_types_count: data_types.len(),
        constants,
        global_variables,
        data_types,
    })
}

pub fn export_data_dictionary_excel(csc_path: &str) -> Result<DataDictionaryExportResult, String> {
    let summary = analyze_data_dictionary_folder(csc_path)?;
    let root = PathBuf::from(csc_path);
    let output_path = root.join("data_dictionnary.xlsx");

    let mut workbook = Workbook::new();
    let header_format = Format::new().set_bold();

    write_constants_sheet(&mut workbook, &header_format, &summary.constants)?;
    write_global_variables_sheet(&mut workbook, &header_format, &summary.global_variables)?;
    write_data_types_sheet(&mut workbook, &header_format, &summary.data_types)?;
    write_summary_sheet(
        &mut workbook,
        &header_format,
        &root,
        summary.source_files,
        summary.header_files,
        summary.constants_count,
        summary.global_variables_count,
        summary.data_types_count,
    )?;

    workbook
        .save(&output_path)
        .map_err(|err| format!("Failed to save data_dictionnary.xlsx: {}", err))?;

    Ok(DataDictionaryExportResult {
        output_path: path_to_string(&output_path),
        source_files: summary.source_files,
        header_files: summary.header_files,
        constants_count: summary.constants_count,
        global_variables_count: summary.global_variables_count,
        data_types_count: summary.data_types_count,
    })
}

fn write_constants_sheet(
    workbook: &mut Workbook,
    header_format: &Format,
    constants: &[ConstantItem],
) -> Result<(), String> {
    let worksheet = workbook.add_worksheet();

    worksheet
        .set_name("Constants")
        .map_err(|err| format!("Failed to name Constants sheet: {}", err))?;

    write_header_row(
        worksheet,
        header_format,
        &[
            "Name",
            "Kind",
            "Value",
            "File",
            "Line",
            "Used in C sources",
        ],
    )?;

    for (index, constant) in constants.iter().enumerate() {
        let row = (index + 1) as u32;

        worksheet
            .write_string(row, 0, &constant.name)
            .map_err(|err| format!("Failed to write constant name: {}", err))?;

        worksheet
            .write_string(row, 1, &constant.kind)
            .map_err(|err| format!("Failed to write constant kind: {}", err))?;

        worksheet
            .write_string(row, 2, &constant.value)
            .map_err(|err| format!("Failed to write constant value: {}", err))?;

        worksheet
            .write_string(row, 3, &constant.relative_path)
            .map_err(|err| format!("Failed to write constant file: {}", err))?;

        worksheet
            .write_number(row, 4, constant.line as f64)
            .map_err(|err| format!("Failed to write constant line: {}", err))?;

        worksheet
            .write_string(row, 5, bool_to_yes_no(constant.used_in_sources))
            .map_err(|err| format!("Failed to write constant usage: {}", err))?;
    }

    Ok(())
}

fn write_global_variables_sheet(
    workbook: &mut Workbook,
    header_format: &Format,
    global_variables: &[GlobalVariableItem],
) -> Result<(), String> {
    let worksheet = workbook.add_worksheet();

    worksheet
        .set_name("Global Variables")
        .map_err(|err| format!("Failed to name Global Variables sheet: {}", err))?;

    write_header_row(
        worksheet,
        header_format,
        &[
            "Name",
            "Data Type",
            "Dimensions",
            "Initializer",
            "File",
            "Line",
            "Used in C sources",
        ],
    )?;

    for (index, variable) in global_variables.iter().enumerate() {
        let row = (index + 1) as u32;

        worksheet
            .write_string(row, 0, &variable.name)
            .map_err(|err| format!("Failed to write variable name: {}", err))?;

        worksheet
            .write_string(row, 1, &variable.data_type)
            .map_err(|err| format!("Failed to write variable data type: {}", err))?;

        worksheet
            .write_string(row, 2, &variable.dimensions)
            .map_err(|err| format!("Failed to write variable dimensions: {}", err))?;

        worksheet
            .write_string(row, 3, &variable.initializer)
            .map_err(|err| format!("Failed to write variable initializer: {}", err))?;

        worksheet
            .write_string(row, 4, &variable.relative_path)
            .map_err(|err| format!("Failed to write variable file: {}", err))?;

        worksheet
            .write_number(row, 5, variable.line as f64)
            .map_err(|err| format!("Failed to write variable line: {}", err))?;

        worksheet
            .write_string(row, 6, bool_to_yes_no(variable.used_in_sources))
            .map_err(|err| format!("Failed to write variable usage: {}", err))?;
    }

    Ok(())
}

fn write_data_types_sheet(
    workbook: &mut Workbook,
    header_format: &Format,
    data_types: &[DataTypeItem],
) -> Result<(), String> {
    let worksheet = workbook.add_worksheet();

    worksheet
        .set_name("Data types")
        .map_err(|err| format!("Failed to name Data types sheet: {}", err))?;

    write_header_row(
        worksheet,
        header_format,
        &[
            "Name",
            "Kind",
            "Definition",
            "File",
            "Line",
            "Used in C sources",
        ],
    )?;

    for (index, data_type) in data_types.iter().enumerate() {
        let row = (index + 1) as u32;

        worksheet
            .write_string(row, 0, &data_type.name)
            .map_err(|err| format!("Failed to write data type name: {}", err))?;

        worksheet
            .write_string(row, 1, &data_type.kind)
            .map_err(|err| format!("Failed to write data type kind: {}", err))?;

        worksheet
            .write_string(row, 2, &data_type.definition)
            .map_err(|err| format!("Failed to write data type definition: {}", err))?;

        worksheet
            .write_string(row, 3, &data_type.relative_path)
            .map_err(|err| format!("Failed to write data type file: {}", err))?;

        worksheet
            .write_number(row, 4, data_type.line as f64)
            .map_err(|err| format!("Failed to write data type line: {}", err))?;

        worksheet
            .write_string(row, 5, bool_to_yes_no(data_type.used_in_sources))
            .map_err(|err| format!("Failed to write data type usage: {}", err))?;
    }

    Ok(())
}

fn write_summary_sheet(
    workbook: &mut Workbook,
    header_format: &Format,
    root: &Path,
    source_files: usize,
    header_files: usize,
    constants_count: usize,
    global_variables_count: usize,
    data_types_count: usize,
) -> Result<(), String> {
    let worksheet = workbook.add_worksheet();

    worksheet
        .set_name("Summary")
        .map_err(|err| format!("Failed to name Summary sheet: {}", err))?;

    write_header_row(worksheet, header_format, &["Item", "Value"])?;

    worksheet
        .write_string(1, 0, "CSC path")
        .map_err(|err| format!("Failed to write summary item: {}", err))?;

    worksheet
        .write_string(1, 1, path_to_string(root))
        .map_err(|err| format!("Failed to write CSC path: {}", err))?;

    worksheet
        .write_string(2, 0, "Source files")
        .map_err(|err| format!("Failed to write summary item: {}", err))?;

    worksheet
        .write_number(2, 1, source_files as f64)
        .map_err(|err| format!("Failed to write source file count: {}", err))?;

    worksheet
        .write_string(3, 0, "Header files")
        .map_err(|err| format!("Failed to write summary item: {}", err))?;

    worksheet
        .write_number(3, 1, header_files as f64)
        .map_err(|err| format!("Failed to write header file count: {}", err))?;

    worksheet
        .write_string(4, 0, "Constants")
        .map_err(|err| format!("Failed to write summary item: {}", err))?;

    worksheet
        .write_number(4, 1, constants_count as f64)
        .map_err(|err| format!("Failed to write constants count: {}", err))?;

    worksheet
        .write_string(5, 0, "Global variables")
        .map_err(|err| format!("Failed to write summary item: {}", err))?;

    worksheet
        .write_number(5, 1, global_variables_count as f64)
        .map_err(|err| format!("Failed to write global variables count: {}", err))?;

    worksheet
        .write_string(6, 0, "Data types")
        .map_err(|err| format!("Failed to write summary item: {}", err))?;

    worksheet
        .write_number(6, 1, data_types_count as f64)
        .map_err(|err| format!("Failed to write data types count: {}", err))?;

    Ok(())
}

fn collect_code_files(folder: &Path, code_files: &mut Vec<CodeFile>) -> Result<(), String> {
    if should_ignore_dir(folder) {
        return Ok(());
    }

    let entries = read_dir_sorted(folder)?;

    for entry in entries {
        let path = entry.path();

        if path.is_dir() {
            collect_code_files(&path, code_files)?;
            continue;
        }

        if !path.is_file() {
            continue;
        }

        if is_source_file(&path) {
            code_files.push(CodeFile {
                path,
                kind: CodeFileKind::Source,
            });
        } else if is_header_file(&path) {
            code_files.push(CodeFile {
                path,
                kind: CodeFileKind::Header,
            });
        }
    }

    Ok(())
}

fn build_source_search_text(code_files: &[CodeFile]) -> Result<String, String> {
    let mut source_search_text = String::new();

    for code_file in code_files {
        if code_file.kind != CodeFileKind::Source {
            continue;
        }

        let content = fs::read_to_string(&code_file.path).map_err(|err| {
            format!(
                "Failed to read source file {}: {}",
                path_to_string(&code_file.path),
                err
            )
        })?;

        source_search_text.push_str(&strip_comments_preserve_layout(&content));
        source_search_text.push('\n');
    }

    Ok(source_search_text)
}

fn extract_define_constants(
    content: &str,
    relative_path: &str,
    source_search_text: &str,
) -> Result<Vec<ConstantItem>, String> {
    let define_regex = Regex::new(
        r"^[\t ]*#[\t ]*define[\t ]+(?P<name>[A-Za-z_][A-Za-z0-9_]*)(?P<params>\([^)]*\))?[\t ]*(?P<value>.*)$",
    )
    .map_err(|err| format!("Failed to build #define regex: {}", err))?;

    let mut constants = Vec::new();

    for (line, logical_line) in logical_lines_with_start_lines(content) {
        let Some(captures) = define_regex.captures(&logical_line) else {
            continue;
        };

        let Some(name_match) = captures.name("name") else {
            continue;
        };

        let name = name_match.as_str().trim().to_string();

        let params = captures
            .name("params")
            .map(|value| value.as_str().trim().to_string())
            .unwrap_or_default();

        let value = captures
            .name("value")
            .map(|value| value.as_str().trim().to_string())
            .unwrap_or_default();

        let kind = if params.is_empty() {
            "macro".to_string()
        } else {
            "function-like macro".to_string()
        };

        let displayed_value = if params.is_empty() {
            value
        } else if value.is_empty() {
            params
        } else {
            format!("{} {}", params, value)
        };

        constants.push(ConstantItem {
            name: name.clone(),
            kind,
            value: displayed_value,
            relative_path: relative_path.to_string(),
            line,
            used_in_sources: word_occurs(source_search_text, &name),
        });
    }

    Ok(constants)
}

fn extract_global_variables(
    content: &str,
    relative_path: &str,
    source_search_text: &str,
) -> Result<Vec<GlobalVariableItem>, String> {
    let mut global_variables = Vec::new();

    for (line, statement) in top_level_semicolon_statements(content) {
        if should_skip_global_variable_statement(&statement) {
            continue;
        }

        let mut parsed_items =
            parse_global_variable_statement(&statement, relative_path, line, source_search_text)?;

        global_variables.append(&mut parsed_items);
    }

    Ok(global_variables)
}

fn parse_global_variable_statement(
    statement: &str,
    relative_path: &str,
    line: usize,
    source_search_text: &str,
) -> Result<Vec<GlobalVariableItem>, String> {
    let mut normalized = statement.trim().trim_end_matches(';').trim().to_string();

    if normalized.is_empty() {
        return Ok(Vec::new());
    }

    normalized = collapse_whitespace_outside_strings(&normalized);

    let declarators = split_top_level_commas(&normalized);

    if declarators.is_empty() {
        return Ok(Vec::new());
    }

    let first_regex = Regex::new(
        r"^(?P<data_type>.+?)(?P<pointer>\*+\s*)?(?P<name>[A-Za-z_][A-Za-z0-9_]*)\s*(?P<dimensions>(?:\[[^\]]*\]\s*)*)\s*(?P<initializer>=.*)?$",
    )
    .map_err(|err| format!("Failed to build global variable regex: {}", err))?;

    let next_regex = Regex::new(
        r"^(?P<pointer>\*+\s*)?(?P<name>[A-Za-z_][A-Za-z0-9_]*)\s*(?P<dimensions>(?:\[[^\]]*\]\s*)*)\s*(?P<initializer>=.*)?$",
    )
    .map_err(|err| format!("Failed to build continued global variable regex: {}", err))?;

    let mut variables = Vec::new();
    let mut current_data_type = String::new();

    for (index, declarator) in declarators.iter().enumerate() {
        let declarator = declarator.trim();

        if declarator.is_empty() {
            continue;
        }

        if index == 0 {
            let Some(captures) = first_regex.captures(declarator) else {
                continue;
            };

            let Some(data_type_match) = captures.name("data_type") else {
                continue;
            };

            let Some(name_match) = captures.name("name") else {
                continue;
            };

            let pointer = captures
                .name("pointer")
                .map(|value| value.as_str().trim().to_string())
                .unwrap_or_default();

            let data_type_base = data_type_match.as_str().trim().to_string();

            current_data_type = if pointer.is_empty() {
                data_type_base
            } else {
                format!("{} {}", data_type_base, pointer)
            };

            let name = name_match.as_str().trim().to_string();

            if is_invalid_variable_name(&name) {
                continue;
            }

            variables.push(GlobalVariableItem {
                name: name.clone(),
                data_type: current_data_type.clone(),
                dimensions: captures
                    .name("dimensions")
                    .map(|value| value.as_str().trim().to_string())
                    .unwrap_or_default(),
                initializer: captures
                    .name("initializer")
                    .map(|value| {
                        value
                            .as_str()
                            .trim()
                            .trim_start_matches('=')
                            .trim()
                            .to_string()
                    })
                    .unwrap_or_default(),
                relative_path: relative_path.to_string(),
                line,
                used_in_sources: word_occurs(source_search_text, &name),
            });
        } else {
            let Some(captures) = next_regex.captures(declarator) else {
                continue;
            };

            let Some(name_match) = captures.name("name") else {
                continue;
            };

            let pointer = captures
                .name("pointer")
                .map(|value| value.as_str().trim().to_string())
                .unwrap_or_default();

            let data_type = if pointer.is_empty() {
                current_data_type.clone()
            } else {
                format!("{} {}", current_data_type, pointer)
            };

            let name = name_match.as_str().trim().to_string();

            if is_invalid_variable_name(&name) {
                continue;
            }

            variables.push(GlobalVariableItem {
                name: name.clone(),
                data_type,
                dimensions: captures
                    .name("dimensions")
                    .map(|value| value.as_str().trim().to_string())
                    .unwrap_or_default(),
                initializer: captures
                    .name("initializer")
                    .map(|value| {
                        value
                            .as_str()
                            .trim()
                            .trim_start_matches('=')
                            .trim()
                            .to_string()
                    })
                    .unwrap_or_default(),
                relative_path: relative_path.to_string(),
                line,
                used_in_sources: word_occurs(source_search_text, &name),
            });
        }
    }

    Ok(variables)
}

fn extract_data_types(
    content: &str,
    relative_path: &str,
    source_search_text: &str,
) -> Result<Vec<DataTypeItem>, String> {
    let mut data_types = Vec::new();

    for (line, statement) in top_level_semicolon_statements(content) {
        let Some(data_type) =
            parse_data_type_statement(&statement, relative_path, line, source_search_text)?
        else {
            continue;
        };

        data_types.push(data_type);
    }

    Ok(data_types)
}

fn parse_data_type_statement(
    statement: &str,
    relative_path: &str,
    line: usize,
    source_search_text: &str,
) -> Result<Option<DataTypeItem>, String> {
    let normalized = collapse_whitespace_outside_strings(statement.trim().trim_end_matches(';').trim());

    if normalized.is_empty() {
        return Ok(None);
    }

    let lower = normalized.to_lowercase();

    if lower.starts_with("typedef ") {
        return parse_typedef_statement(&normalized, relative_path, line, source_search_text);
    }

    if lower.starts_with("struct ") {
        return parse_tagged_type_statement(
            &normalized,
            "struct",
            relative_path,
            line,
            source_search_text,
        );
    }

    if lower.starts_with("enum ") {
        return parse_tagged_type_statement(
            &normalized,
            "enum",
            relative_path,
            line,
            source_search_text,
        );
    }

    if lower.starts_with("union ") {
        return parse_tagged_type_statement(
            &normalized,
            "union",
            relative_path,
            line,
            source_search_text,
        );
    }

    Ok(None)
}

fn parse_typedef_statement(
    statement: &str,
    relative_path: &str,
    line: usize,
    source_search_text: &str,
) -> Result<Option<DataTypeItem>, String> {
    let lower = statement.to_lowercase();

    let kind = if lower.starts_with("typedef struct") {
        "typedef struct"
    } else if lower.starts_with("typedef enum") {
        "typedef enum"
    } else if lower.starts_with("typedef union") {
        "typedef union"
    } else {
        "typedef"
    };

    let Some(name) = extract_typedef_name(statement)? else {
        return Ok(None);
    };

    Ok(Some(DataTypeItem {
        name: name.clone(),
        kind: kind.to_string(),
        definition: statement.to_string(),
        relative_path: relative_path.to_string(),
        line,
        used_in_sources: word_occurs(source_search_text, &name),
    }))
}

fn parse_tagged_type_statement(
    statement: &str,
    kind: &str,
    relative_path: &str,
    line: usize,
    source_search_text: &str,
) -> Result<Option<DataTypeItem>, String> {
    let regex = Regex::new(r"^(?P<kind>struct|enum|union)\s+(?P<name>[A-Za-z_][A-Za-z0-9_]*)")
        .map_err(|err| format!("Failed to build tagged type regex: {}", err))?;

    let Some(captures) = regex.captures(statement) else {
        return Ok(None);
    };

    let Some(name_match) = captures.name("name") else {
        return Ok(None);
    };

    let name = name_match.as_str().trim().to_string();

    if is_invalid_variable_name(&name) {
        return Ok(None);
    }

    Ok(Some(DataTypeItem {
        name: name.clone(),
        kind: kind.to_string(),
        definition: statement.to_string(),
        relative_path: relative_path.to_string(),
        line,
        used_in_sources: word_occurs(source_search_text, &name),
    }))
}

fn extract_typedef_name(statement: &str) -> Result<Option<String>, String> {
    let function_pointer_regex = Regex::new(r"\(\s*\*\s*(?P<name>[A-Za-z_][A-Za-z0-9_]*)\s*\)")
        .map_err(|err| format!("Failed to build function pointer typedef regex: {}", err))?;

    if let Some(captures) = function_pointer_regex.captures(statement) {
        if let Some(name_match) = captures.name("name") {
            return Ok(Some(name_match.as_str().trim().to_string()));
        }
    }

    let final_name_regex = Regex::new(r"(?P<name>[A-Za-z_][A-Za-z0-9_]*)\s*(?:\[[^\]]*\]\s*)*$")
        .map_err(|err| format!("Failed to build typedef name regex: {}", err))?;

    let Some(captures) = final_name_regex.captures(statement) else {
        return Ok(None);
    };

    let Some(name_match) = captures.name("name") else {
        return Ok(None);
    };

    let name = name_match.as_str().trim().to_string();

    if is_invalid_variable_name(&name) {
        return Ok(None);
    }

    Ok(Some(name))
}

fn should_skip_global_variable_statement(statement: &str) -> bool {
    let trimmed = statement.trim();

    if trimmed.is_empty() {
        return true;
    }

    if trimmed.starts_with('#') {
        return true;
    }

    let lower = trimmed.to_lowercase();

    let skipped_prefixes = [
        "typedef ",
        "return ",
        "if ",
        "if(",
        "for ",
        "for(",
        "while ",
        "while(",
        "switch ",
        "switch(",
        "case ",
        "break",
        "continue",
        "goto ",
        "do ",
        "else ",
    ];

    if skipped_prefixes.iter().any(|prefix| lower.starts_with(prefix)) {
        return true;
    }

    if lower.starts_with("struct ") && trimmed.contains('{') {
        return true;
    }

    if lower.starts_with("enum ") && trimmed.contains('{') {
        return true;
    }

    if lower.starts_with("union ") && trimmed.contains('{') {
        return true;
    }

    if looks_like_function_prototype(trimmed) {
        return true;
    }

    false
}

fn looks_like_function_prototype(statement: &str) -> bool {
    let without_semicolon = statement.trim().trim_end_matches(';').trim();

    if without_semicolon.contains('=') {
        return false;
    }

    let Ok(regex) = Regex::new(
        r"^[A-Za-z_][A-Za-z0-9_\s\*\(\),]*[\s\*]+[A-Za-z_][A-Za-z0-9_]*\s*\([^;{}]*\)$",
    ) else {
        return false;
    };

    regex.is_match(without_semicolon)
}

fn is_invalid_variable_name(name: &str) -> bool {
    let reserved_words = [
        "if",
        "else",
        "for",
        "while",
        "switch",
        "case",
        "return",
        "sizeof",
        "typedef",
        "struct",
        "enum",
        "union",
        "const",
        "volatile",
        "static",
        "extern",
    ];

    reserved_words.contains(&name)
}

fn top_level_semicolon_statements(content: &str) -> Vec<(usize, String)> {
    let mut statements = Vec::new();

    let mut current = String::new();
    let mut line_number = 1usize;
    let mut statement_start_line = 1usize;
    let mut has_started_statement = false;

    let mut brace_depth = 0usize;
    let mut paren_depth = 0usize;
    let mut bracket_depth = 0usize;

    let chars: Vec<char> = content.chars().collect();
    let mut index = 0usize;

    while index < chars.len() {
        let ch = chars[index];

        if !has_started_statement && !ch.is_whitespace() {
            has_started_statement = true;
            statement_start_line = line_number;
        }

        if has_started_statement {
            current.push(ch);
        }

        match ch {
            '{' => {
                brace_depth += 1;
            }
            '}' => {
                brace_depth = brace_depth.saturating_sub(1);
            }
            '(' => {
                paren_depth += 1;
            }
            ')' => {
                paren_depth = paren_depth.saturating_sub(1);
            }
            '[' => {
                bracket_depth += 1;
            }
            ']' => {
                bracket_depth = bracket_depth.saturating_sub(1);
            }
            ';' => {
                if brace_depth == 0 && paren_depth == 0 && bracket_depth == 0 {
                    let statement = current.trim().to_string();

                    if !statement.is_empty() {
                        statements.push((statement_start_line, statement));
                    }

                    current.clear();
                    has_started_statement = false;
                }
            }
            '\n' => {
                line_number += 1;
            }
            _ => {}
        }

        index += 1;
    }

    statements
}

fn logical_lines_with_start_lines(content: &str) -> Vec<(usize, String)> {
    let mut logical_lines = Vec::new();

    let mut current = String::new();
    let mut start_line = 1usize;
    let mut is_collecting = false;

    for (index, raw_line) in content.lines().enumerate() {
        let line_number = index + 1;
        let line = raw_line.trim_end_matches('\r');

        let trimmed_end = line.trim_end();
        let continues = trimmed_end.ends_with('\\');

        let line_without_continuation = if continues {
            trimmed_end.trim_end_matches('\\').trim_end()
        } else {
            line
        };

        if !is_collecting {
            start_line = line_number;
            current.clear();
            is_collecting = true;
        } else {
            current.push(' ');
        }

        current.push_str(line_without_continuation.trim_end());

        if !continues {
            logical_lines.push((start_line, current.clone()));
            current.clear();
            is_collecting = false;
        }
    }

    if is_collecting && !current.trim().is_empty() {
        logical_lines.push((start_line, current));
    }

    logical_lines
}

fn split_top_level_commas(value: &str) -> Vec<String> {
    let mut parts = Vec::new();
    let mut current = String::new();

    let mut brace_depth = 0usize;
    let mut paren_depth = 0usize;
    let mut bracket_depth = 0usize;

    for ch in value.chars() {
        match ch {
            '{' => {
                brace_depth += 1;
                current.push(ch);
            }
            '}' => {
                brace_depth = brace_depth.saturating_sub(1);
                current.push(ch);
            }
            '(' => {
                paren_depth += 1;
                current.push(ch);
            }
            ')' => {
                paren_depth = paren_depth.saturating_sub(1);
                current.push(ch);
            }
            '[' => {
                bracket_depth += 1;
                current.push(ch);
            }
            ']' => {
                bracket_depth = bracket_depth.saturating_sub(1);
                current.push(ch);
            }
            ',' => {
                if brace_depth == 0 && paren_depth == 0 && bracket_depth == 0 {
                    parts.push(current.trim().to_string());
                    current.clear();
                } else {
                    current.push(ch);
                }
            }
            _ => current.push(ch),
        }
    }

    if !current.trim().is_empty() {
        parts.push(current.trim().to_string());
    }

    parts
}

fn collapse_whitespace_outside_strings(value: &str) -> String {
    let mut result = String::new();
    let mut last_was_whitespace = false;

    for ch in value.chars() {
        if ch.is_whitespace() {
            if !last_was_whitespace {
                result.push(' ');
                last_was_whitespace = true;
            }
        } else {
            result.push(ch);
            last_was_whitespace = false;
        }
    }

    result.trim().to_string()
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

fn word_occurs(content: &str, word: &str) -> bool {
    let pattern = format!(r"\b{}\b", regex::escape(word));

    Regex::new(&pattern)
        .map(|regex| regex.is_match(content))
        .unwrap_or(false)
}

fn bool_to_yes_no(value: bool) -> &'static str {
    if value {
        "Yes"
    } else {
        "No"
    }
}

fn is_source_file(path: &Path) -> bool {
    let extension = extension_lowercase(path);
    SOURCE_EXTENSIONS.contains(&extension.as_str())
}

fn is_header_file(path: &Path) -> bool {
    let extension = extension_lowercase(path);
    HEADER_EXTENSIONS.contains(&extension.as_str())
}

fn should_ignore_dir(path: &Path) -> bool {
    let folder_name = file_name_lowercase(path);
    IGNORED_DIRS.contains(&folder_name.as_str())
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
