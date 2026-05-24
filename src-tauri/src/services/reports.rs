use std::path::PathBuf;

use crate::infrastructure::reports;
use crate::shared::blocking::run_blocking;

pub async fn reveal_path_in_file_manager(path: String) -> Result<(), String> {
    let target = parse_path(path)?;

    run_blocking("reveal report path", move || {
        reports::reveal_path_in_file_manager(&target)
    })
    .await
}

fn parse_path(path: String) -> Result<PathBuf, String> {
    let trimmed = path.trim();

    if trimmed.is_empty() {
        return Err("Path is required.".to_string());
    }

    Ok(PathBuf::from(trimmed))
}