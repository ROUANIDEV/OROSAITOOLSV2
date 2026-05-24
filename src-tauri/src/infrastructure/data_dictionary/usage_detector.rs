use regex::Regex;

use super::models::SourceDocument;

pub fn is_symbol_used_in_sources(
    documents: &[SourceDocument],
    symbol_name: &str,
) -> bool {
    if symbol_name.trim().is_empty() {
        return false;
    }

    let Ok(regex) = build_symbol_regex(symbol_name) else {
        return false;
    };

    let occurrences = documents
        .iter()
        .map(|document| count_symbol_occurrences(document, &regex))
        .sum::<usize>();

    occurrences > 1
}

fn build_symbol_regex(symbol_name: &str) -> Result<Regex, regex::Error> {
    let escaped_name = regex::escape(symbol_name);
    Regex::new(&format!(r"\b{escaped_name}\b"))
}

fn count_symbol_occurrences(
    document: &SourceDocument,
    regex: &Regex,
) -> usize {
    regex.find_iter(&document.content).count()
}