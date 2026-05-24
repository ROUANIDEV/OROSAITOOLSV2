use std::path::{Path, PathBuf};
use std::process::Command;

pub fn reveal_path_in_file_manager(path: &Path) -> Result<(), String> {
    open_in_file_manager(path)
}

fn folder_to_open(target: &Path) -> PathBuf {
    if target.exists() && target.is_dir() {
        return target.to_path_buf();
    }

    target
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| target.to_path_buf())
}

#[cfg(target_os = "windows")]
fn open_in_file_manager(target: &Path) -> Result<(), String> {
    let mut command = Command::new("explorer");

    if target.exists() && target.is_file() {
        command.arg(format!("/select,{}", target.display()));
    } else {
        command.arg(folder_to_open(target));
    }

    command
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("Failed to open File Explorer: {error}"))
}

#[cfg(target_os = "macos")]
fn open_in_file_manager(target: &Path) -> Result<(), String> {
    let mut command = Command::new("open");

    if target.exists() && target.is_file() {
        command.arg("-R").arg(target);
    } else {
        command.arg(folder_to_open(target));
    }

    command
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("Failed to open Finder: {error}"))
}

#[cfg(all(unix, not(target_os = "macos")))]
fn open_in_file_manager(target: &Path) -> Result<(), String> {
    Command::new("xdg-open")
        .arg(folder_to_open(target))
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("Failed to open file manager: {error}"))
}