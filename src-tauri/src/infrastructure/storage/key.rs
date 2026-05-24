pub fn validate_storage_key(key: &str) -> Result<String, String> {
    let trimmed = key.trim();

    if trimmed.is_empty() {
        return Err("Storage key cannot be empty.".to_string());
    }

    if trimmed.len() > 120 {
        return Err(
            "Storage key is too long. Maximum length is 120 characters."
                .to_string(),
        );
    }

    if trimmed.starts_with('.') || trimmed.ends_with('.') {
        return Err("Storage key cannot start or end with a dot.".to_string());
    }

    if trimmed.contains("..") {
        return Err("Storage key cannot contain '..'.".to_string());
    }

    if !contains_only_safe_characters(trimmed) {
        return Err(
            "Storage key can only contain letters, numbers, dots, underscores, and dashes."
                .to_string(),
        );
    }

    Ok(trimmed.to_string())
}

fn contains_only_safe_characters(value: &str) -> bool {
    value.chars().all(|character| {
        character.is_ascii_alphanumeric()
            || character == '.'
            || character == '_'
            || character == '-'
    })
}