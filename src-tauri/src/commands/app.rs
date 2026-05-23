use crate::domain::app_info::AppInfo;

#[tauri::command]
pub fn get_app_info() -> AppInfo {
    AppInfo::new()
}
