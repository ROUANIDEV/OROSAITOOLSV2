use crate::domain::app_info::AppInfo;
use crate::services::app_info;

#[tauri::command]
pub fn get_app_info() -> AppInfo {
    app_info::get_app_info()
}