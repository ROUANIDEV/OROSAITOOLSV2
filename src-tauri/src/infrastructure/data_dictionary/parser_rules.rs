use regex::Regex;

use super::constants::C_KEYWORDS;
use super::models::{
    ParsedConstant, ParsedDataType, ParsedDictionary, ParsedGlobalVariable, SourceDocument,
};
use super::parser_regex::DataTypeRegexes;

struct TopLevelItem {
    text: String,
    line: usize,
}

struct VariableDeclaration {
    name: String,
    data_type: String,
    dimensions: String,
    initializer: String,
}

pub fn parse_document(
    document: &SourceDocument,
    define_regex: &Regex,
    data_type_regexes: &DataTypeRegexes,
    parsed: &mut ParsedDictionary,
) {
    let content = strip_comments_preserve_lines(&document.content);

    parse_define_constants(document, &content, define_regex, parsed);

    for item in collect_top_level_items(&content) {
        let statement = item.text.trim();
        if statement.is_empty() {
            continue;
        }

        if parse_data_type_statement(document, statement, item.line, data_type_regexes, parsed) {
            continue;
        }

        if parse_const_statement(document, statement, item.line, parsed) {
            continue;
        }

        parse_global_statement(document, statement, item.line, parsed);
    }
}

fn parse_define_constants(
    document: &SourceDocument,
    content: &str,
    define_regex: &Regex,
    parsed: &mut ParsedDictionary,
) {
    for (line_index, line) in content.lines().enumerate() {
        let Some(captures) = define_regex.captures(line.trim()) else {
            continue;
        };

        let name = captures["name"].to_string();
        if parsed.constants.iter().any(|constant| constant.name == name) {
            continue;
        }

        parsed.constants.push(ParsedConstant {
            name,
            kind: "Define".to_string(),
            value: captures
                .name("value")
                .map(|value| value.as_str().trim().to_string())
                .unwrap_or_default(),
            relative_path: document.relative_path.clone(),
            line: line_index + 1,
        });
    }
}

fn parse_data_type_statement(
    document: &SourceDocument,
    statement: &str,
    line_number: usize,
    regexes: &DataTypeRegexes,
    parsed: &mut ParsedDictionary,
) -> bool {
    if let Some(captures) = regexes.typedef_block.captures(statement) {
        let c_kind = captures.get(1).map(|value| value.as_str()).unwrap_or_default();
        let name = captures.get(2).map(|value| value.as_str()).unwrap_or_default();
        let dimensions = captures.get(3).map(|value| value.as_str()).unwrap_or_default();

        push_data_type(
            parsed,
            document,
            name,
            typedef_block_kind(c_kind, dimensions),
            statement,
            line_number,
        );
        return true;
    }

    if let Some(captures) = regexes.enum_no_typedef.captures(statement) {
        let name = captures.get(1).map(|value| value.as_str()).unwrap_or_default();
        push_data_type(
            parsed,
            document,
            name,
            "Enumeration".to_string(),
            statement,
            line_number,
        );
        return true;
    }

    if let Some(captures) = regexes.function_pointer_typedef.captures(statement) {
        let name = captures.get(1).map(|value| value.as_str()).unwrap_or_default();
        push_data_type(
            parsed,
            document,
            name,
            "Function Pointer".to_string(),
            statement,
            line_number,
        );
        return true;
    }

    let lower = statement.trim_start().to_ascii_lowercase();
    if lower.starts_with("typedef struct")
        || lower.starts_with("typedef enum")
        || lower.starts_with("typedef union")
    {
        return false;
    }

    if let Some(captures) = regexes.typedef_alias.captures(statement) {
        let name = captures.get(2).map(|value| value.as_str()).unwrap_or_default();
        let dimensions = captures.get(3).map(|value| value.as_str()).unwrap_or_default();
        let kind = if dimensions.trim().is_empty() {
            "typedef".to_string()
        } else {
            "Array typedef".to_string()
        };

        push_data_type(parsed, document, name, kind, statement, line_number);
        return true;
    }

    false
}

fn typedef_block_kind(c_kind: &str, dimensions: &str) -> String {
    let base = match c_kind {
        "struct" => "Structure",
        "enum" => "Enumeration",
        "union" => "Union",
        _ => "typedef",
    };

    if dimensions.trim().is_empty() {
        base.to_string()
    } else {
        format!("Array of {base}")
    }
}

fn push_data_type(
    parsed: &mut ParsedDictionary,
    document: &SourceDocument,
    name: &str,
    kind: String,
    statement: &str,
    line_number: usize,
) {
    if name.trim().is_empty() {
        return;
    }

    if parsed.data_types.iter().any(|data_type| data_type.name == name) {
        return;
    }

    parsed.data_types.push(ParsedDataType {
        name: name.to_string(),
        kind,
        definition: normalize_statement(statement),
        relative_path: document.relative_path.clone(),
        line: line_number,
    });
}

fn parse_const_statement(
    document: &SourceDocument,
    statement: &str,
    line_number: usize,
    parsed: &mut ParsedDictionary,
) -> bool {
    let Some(after_const) = strip_const_prefix(statement) else {
        return false;
    };

    let Some(declaration) = parse_variable_declaration(after_const) else {
        return true;
    };

    if declaration.initializer.is_empty() {
        return true;
    }

    if parsed
        .constants
        .iter()
        .any(|constant| constant.name == declaration.name)
    {
        return true;
    }

    parsed.constants.push(ParsedConstant {
        name: declaration.name,
        kind: declaration.data_type,
        value: declaration.initializer,
        relative_path: document.relative_path.clone(),
        line: line_number,
    });

    true
}

fn parse_global_statement(
    document: &SourceDocument,
    statement: &str,
    line_number: usize,
    parsed: &mut ParsedDictionary,
) {
    if !looks_like_global_declaration(statement) {
        return;
    }

    let Some(declaration) = parse_variable_declaration(statement) else {
        return;
    };

    if C_KEYWORDS.contains(&declaration.name.as_str()) {
        return;
    }

    if parsed
        .global_variables
        .iter()
        .any(|variable| variable.name == declaration.name)
    {
        return;
    }

    let dimensions = if declaration.dimensions.trim().is_empty() {
        "N.A".to_string()
    } else {
        normalize_dimensions(&declaration.dimensions)
    };

    let data_type = if dimensions == "N.A" {
        declaration.data_type
    } else {
        format!("Array of {}", declaration.data_type)
    };

    parsed.global_variables.push(ParsedGlobalVariable {
        name: declaration.name,
        data_type,
        dimensions,
        initializer: declaration.initializer,
        relative_path: document.relative_path.clone(),
        line: line_number,
    });
}

pub fn looks_like_global_declaration(statement: &str) -> bool {
    let trimmed = statement.trim();

    if trimmed.is_empty() || !trimmed.ends_with(';') {
        return false;
    }

    let lower = trimmed.to_ascii_lowercase();
    if lower.starts_with('#')
        || lower.starts_with("typedef")
        || lower.starts_with("struct ")
        || lower.starts_with("enum ")
        || lower.starts_with("union ")
        || strip_const_prefix(trimmed).is_some()
    {
        return false;
    }

    if trimmed.contains('(') || trimmed.contains(')') {
        return false;
    }

    if starts_with_block_keyword(trimmed) {
        return false;
    }

    true
}

fn starts_with_block_keyword(line: &str) -> bool {
    let keywords = [
        "if", "for", "while", "switch", "return", "case", "break", "continue", "else", "do",
    ];

    keywords.iter().any(|keyword| {
        line == *keyword
            || line
                .strip_prefix(*keyword)
                .and_then(|rest| rest.chars().next())
                .map(|character| character.is_whitespace())
                .unwrap_or(false)
    })
}

fn strip_const_prefix(statement: &str) -> Option<&str> {
    let mut rest = statement.trim_start();

    loop {
        let before = rest;
        rest = consume_keyword(rest, "static").unwrap_or(rest);
        rest = consume_keyword(rest, "extern").unwrap_or(rest);
        rest = consume_keyword(rest, "volatile").unwrap_or(rest);
        rest = consume_keyword(rest, "register").unwrap_or(rest);

        if before == rest {
            break;
        }
    }

    consume_keyword(rest, "const")
}

fn consume_keyword<'a>(text: &'a str, keyword: &str) -> Option<&'a str> {
    let trimmed = text.trim_start();
    let suffix = trimmed.strip_prefix(keyword)?;

    if suffix
        .chars()
        .next()
        .map(|character| character == '_' || character.is_ascii_alphanumeric())
        .unwrap_or(false)
    {
        return None;
    }

    Some(suffix.trim_start())
}

fn parse_variable_declaration(statement: &str) -> Option<VariableDeclaration> {
    let without_semicolon = statement.trim().strip_suffix(';')?.trim();
    let (declaration_part, initializer) = split_initializer(without_semicolon);
    let (declaration_part, dimensions) = take_trailing_dimensions(declaration_part.trim());
    let (name_start, name_end) = trailing_identifier_bounds(declaration_part)?;

    let name = declaration_part[name_start..name_end].to_string();
    let data_type = declaration_part[..name_start].trim().to_string();

    if data_type.is_empty() || C_KEYWORDS.contains(&name.as_str()) {
        return None;
    }

    Some(VariableDeclaration {
        name,
        data_type: normalize_statement(&data_type),
        dimensions,
        initializer: initializer.trim().to_string(),
    })
}

fn split_initializer(text: &str) -> (&str, &str) {
    let mut brace_depth = 0usize;
    let mut paren_depth = 0usize;
    let mut bracket_depth = 0usize;

    for (index, character) in text.char_indices() {
        match character {
            '{' => brace_depth += 1,
            '}' => brace_depth = brace_depth.saturating_sub(1),
            '(' => paren_depth += 1,
            ')' => paren_depth = paren_depth.saturating_sub(1),
            '[' => bracket_depth += 1,
            ']' => bracket_depth = bracket_depth.saturating_sub(1),
            '=' if brace_depth == 0 && paren_depth == 0 && bracket_depth == 0 => {
                return (&text[..index], &text[index + 1..]);
            }
            _ => {}
        }
    }

    (text, "")
}

fn take_trailing_dimensions(text: &str) -> (&str, String) {
    let mut end = text.trim_end().len();
    let mut dimensions = Vec::new();

    while end > 0 && text[..end].trim_end().ends_with(']') {
        end = text[..end].trim_end().len();
        let mut depth = 0usize;
        let mut start = None;

        for (index, character) in text[..end].char_indices().rev() {
            match character {
                ']' => depth += 1,
                '[' => {
                    depth = depth.saturating_sub(1);
                    if depth == 0 {
                        start = Some(index);
                        break;
                    }
                }
                _ => {}
            }
        }

        let Some(start_index) = start else {
            break;
        };

        dimensions.push(text[start_index..end].trim().to_string());
        end = start_index;
    }

    dimensions.reverse();
    (text[..end].trim_end(), dimensions.join(""))
}

fn trailing_identifier_bounds(text: &str) -> Option<(usize, usize)> {
    let bytes = text.as_bytes();
    let mut end = bytes.len();

    while end > 0 && bytes[end - 1].is_ascii_whitespace() {
        end -= 1;
    }

    let mut start = end;
    while start > 0 && is_ident_continue(bytes[start - 1]) {
        start -= 1;
    }

    if start == end || !is_ident_start(bytes[start]) {
        return None;
    }

    Some((start, end))
}

fn is_ident_start(byte: u8) -> bool {
    byte == b'_' || byte.is_ascii_alphabetic()
}

fn is_ident_continue(byte: u8) -> bool {
    is_ident_start(byte) || byte.is_ascii_digit()
}

fn collect_top_level_items(content: &str) -> Vec<TopLevelItem> {
    let mut items = Vec::new();
    let mut current = String::new();
    let mut current_line = 1usize;
    let mut line = 1usize;
    let mut brace_depth = 0usize;
    let mut paren_depth = 0usize;
    let mut bracket_depth = 0usize;
    let mut skipping_function_body = false;
    let mut skipped_function_brace_depth = 0usize;

    for character in content.chars() {
        if skipping_function_body {
            match character {
                '{' => skipped_function_brace_depth += 1,
                '}' => {
                    skipped_function_brace_depth = skipped_function_brace_depth.saturating_sub(1);
                    if skipped_function_brace_depth == 0 {
                        skipping_function_body = false;
                    }
                }
                '\n' => line += 1,
                _ => {}
            }
            continue;
        }

        if current.trim().is_empty() && !character.is_whitespace() {
            current_line = line;
        }

        if brace_depth == 0 && character == '{' && looks_like_function_definition_header(&current) {
            current.clear();
            skipping_function_body = true;
            skipped_function_brace_depth = 1;
            continue;
        }

        current.push(character);

        match character {
            '{' => brace_depth += 1,
            '}' => brace_depth = brace_depth.saturating_sub(1),
            '(' => paren_depth += 1,
            ')' => paren_depth = paren_depth.saturating_sub(1),
            '[' => bracket_depth += 1,
            ']' => bracket_depth = bracket_depth.saturating_sub(1),
            ';' if brace_depth == 0 && paren_depth == 0 && bracket_depth == 0 => {
                items.push(TopLevelItem {
                    text: current.clone(),
                    line: current_line,
                });
                current.clear();
            }
            '\n' => line += 1,
            _ => {}
        }
    }

    items
}

fn looks_like_function_definition_header(text: &str) -> bool {
    let trimmed = text.trim();
    let lower = trimmed.to_ascii_lowercase();

    if lower.starts_with("typedef")
        || lower.starts_with("struct")
        || lower.starts_with("enum")
        || lower.starts_with("union")
        || trimmed.contains('=')
    {
        return false;
    }

    trimmed.ends_with(')') && trimmed.contains('(')
}

fn strip_comments_preserve_lines(content: &str) -> String {
    let mut output = String::with_capacity(content.len());
    let mut chars = content.chars().peekable();

    while let Some(character) = chars.next() {
        match character {
            '/' if chars.peek() == Some(&'/') => {
                chars.next();
                for comment_character in chars.by_ref() {
                    if comment_character == '\n' {
                        output.push('\n');
                        break;
                    }
                }
            }
            '/' if chars.peek() == Some(&'*') => {
                chars.next();
                let mut previous = '\0';
                for comment_character in chars.by_ref() {
                    if comment_character == '\n' {
                        output.push('\n');
                    }
                    if previous == '*' && comment_character == '/' {
                        break;
                    }
                    previous = comment_character;
                }
                output.push(' ');
            }
            '"' | '\'' => {
                output.push(character);
                copy_string_literal(character, &mut chars, &mut output);
            }
            _ => output.push(character),
        }
    }

    output
}

fn copy_string_literal(
    quote: char,
    chars: &mut std::iter::Peekable<std::str::Chars<'_>>,
    output: &mut String,
) {
    let mut escaped = false;

    for character in chars.by_ref() {
        output.push(character);

        if escaped {
            escaped = false;
            continue;
        }

        if character == '\\' {
            escaped = true;
            continue;
        }

        if character == quote {
            break;
        }
    }
}

fn normalize_statement(statement: &str) -> String {
    statement.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn normalize_dimensions(dimensions: &str) -> String {
    dimensions.split_whitespace().collect::<String>()
}
