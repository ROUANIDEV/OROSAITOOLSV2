use std::{
    fs::OpenOptions,
    io::Write,
    path::{Path, PathBuf},
};

use crate::domain::custom_tools::CustomToolAppendTextResult;

const REQUIRED_CONFIRMATION: &str = "APPEND";

pub async fn append_text(
    target_path: String,
    text: String,
    confirmation: String,
    file_write_permission: bool,
) -> Result<CustomToolAppendTextResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        append_text_sync(target_path, text, confirmation, file_write_permission)
    })
    .await
    .map_err(|error| error.to_string())?
}

fn append_text_sync(
    target_path: String,
    text: String,
    confirmation: String,
    file_write_permission: bool,
) -> Result<CustomToolAppendTextResult, String> {
    if !file_write_permission {
        return Err("This tool does not have fileWrite permission.".to_string());
    }

    if confirmation.trim() != REQUIRED_CONFIRMATION {
        return Err("Type APPEND to confirm this file write.".to_string());
    }

    let cleaned_target = clean_user_path(&target_path);

    if cleaned_target.is_empty() {
        return Err("Choose a target file before appending text.".to_string());
    }

    let path = PathBuf::from(&cleaned_target);

    if !path.exists() {
        return Err(format!("Target file does not exist: {cleaned_target}"));
    }

    if !path.is_file() {
        return Err(format!("Target path is not a file: {cleaned_target}"));
    }

    let append_text = ensure_trailing_newline(text);

    if append_text.is_empty() {
        return Err("There is no generated text to append.".to_string());
    }

    let bytes = append_text.as_bytes();
    let mut file = OpenOptions::new()
        .append(true)
        .open(&path)
        .map_err(|error| format!("Unable to open target file: {error}"))?;

    file.write_all(bytes)
        .map_err(|error| format!("Unable to append text: {error}"))?;

    file.flush()
        .map_err(|error| format!("Unable to flush file changes: {error}"))?;

    Ok(CustomToolAppendTextResult {
        target_path: normalize_path(&path),
        bytes_appended: bytes.len(),
    })
}

fn clean_user_path(raw_path: &str) -> String {
    raw_path
        .trim()
        .trim_matches('"')
        .trim_matches('\'')
        .trim()
        .to_string()
}

fn ensure_trailing_newline(text: String) -> String {
    if text.is_empty() || text.ends_with('\n') {
        text
    } else {
        format!("{text}\n")
    }
}

fn normalize_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}