use regex::Regex;

use super::constants::C_KEYWORDS;

use super::models::{
    ParsedConstant,
    ParsedDataType,
    ParsedDictionary,
    ParsedGlobalVariable,
    SourceDocument,
};

use super::parser_regex::{
    build_define_regex,
    build_global_regex,
    build_typedef_regex,
};

use super::parser_rules::looks_like_global_declaration;

pub fn parse_documents(
    documents: &[SourceDocument],
) -> Result<ParsedDictionary, String> {
    let define_regex = build_define_regex()?;
    let typedef_regex = build_typedef_regex()?;
    let global_regex = build_global_regex()?;

    let mut parsed = ParsedDictionary {
        constants: Vec::new(),
        global_variables: Vec::new(),
        data_types: Vec::new(),
    };

    for document in documents {
        parse_document(
            document,
            &define_regex,
            &typedef_regex,
            &global_regex,
            &mut parsed,
        );
    }

    Ok(parsed)
}

fn parse_document(
    document: &SourceDocument,
    define_regex: &Regex,
    typedef_regex: &Regex,
    global_regex: &Regex,
    parsed: &mut ParsedDictionary,
) {
    for (line_index, line) in document.content.lines().enumerate() {
        let line_number = line_index + 1;
        let trimmed = line.trim();

        parse_constant_line(document, trimmed, line_number, define_regex, parsed);
        parse_typedef_line(document, trimmed, line_number, typedef_regex, parsed);
        parse_global_line(document, trimmed, line_number, global_regex, parsed);
    }
}

fn parse_constant_line(
    document: &SourceDocument,
    line: &str,
    line_number: usize,
    define_regex: &Regex,
    parsed: &mut ParsedDictionary,
) {
    let Some(captures) = define_regex.captures(line) else {
        return;
    };

    parsed.constants.push(ParsedConstant {
        name: captures["name"].to_string(),
        kind: "macro".to_string(),
        value: captures
            .name("value")
            .map(|value| value.as_str().trim().to_string())
            .unwrap_or_default(),
        relative_path: document.relative_path.clone(),
        line: line_number,
    });
}

fn parse_typedef_line(
    document: &SourceDocument,
    line: &str,
    line_number: usize,
    typedef_regex: &Regex,
    parsed: &mut ParsedDictionary,
) {
    let Some(captures) = typedef_regex.captures(line) else {
        return;
    };

    parsed.data_types.push(ParsedDataType {
        name: captures["name"].to_string(),
        kind: "typedef".to_string(),
        definition: line.to_string(),
        relative_path: document.relative_path.clone(),
        line: line_number,
    });
}

fn parse_global_line(
    document: &SourceDocument,
    line: &str,
    line_number: usize,
    global_regex: &Regex,
    parsed: &mut ParsedDictionary,
) {
    if !looks_like_global_declaration(line) {
        return;
    }

    let Some(captures) = global_regex.captures(line) else {
        return;
    };

    let name = captures["name"].to_string();

    if C_KEYWORDS.contains(&name.as_str()) {
        return;
    }

    parsed.global_variables.push(ParsedGlobalVariable {
        name,
        data_type: captures["type"].trim().to_string(),
        dimensions: captures
            .name("dims")
            .map(|value| value.as_str().to_string())
            .unwrap_or_default(),
        initializer: captures
            .name("init")
            .map(|value| value.as_str().trim().to_string())
            .unwrap_or_default(),
        relative_path: document.relative_path.clone(),
        line: line_number,
    });
}