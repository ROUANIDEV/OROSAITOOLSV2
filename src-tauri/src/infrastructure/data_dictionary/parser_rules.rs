pub fn looks_like_global_declaration(line: &str) -> bool {
    let trimmed = line.trim();

    if trimmed.is_empty() {
        return false;
    }

    if !trimmed.ends_with(';') {
        return false;
    }

    if trimmed.starts_with('#') {
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
        "if",
        "for",
        "while",
        "switch",
        "return",
        "case",
        "break",
        "continue",
        "else",
        "do",
    ];

    keywords.iter().any(|keyword| {
        line == *keyword || line.starts_with(&format!("{keyword} "))
    })
}