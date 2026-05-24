use super::models::{ParsedDictionary, SourceDocument};
use super::parser_regex::{build_data_type_regexes, build_define_regex};
use super::parser_rules::parse_document;

pub fn parse_documents(documents: &[SourceDocument]) -> Result<ParsedDictionary, String> {
    let define_regex = build_define_regex()?;
    let data_type_regexes = build_data_type_regexes()?;

    let mut parsed = ParsedDictionary {
        constants: Vec::new(),
        global_variables: Vec::new(),
        data_types: Vec::new(),
    };

    for document in documents {
        parse_document(document, &define_regex, &data_type_regexes, &mut parsed);
    }

    Ok(parsed)
}
