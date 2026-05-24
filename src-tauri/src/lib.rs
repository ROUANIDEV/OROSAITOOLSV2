mod commands;
mod domain;

use tauri::Manager;

#[tauri::command]
async fn splashscreen_ready(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(splashscreen) = app.get_webview_window("splashscreen") {
        splashscreen
            .show()
            .map_err(|error| format!("failed to show splashscreen: {error}"))?;

        let _ = splashscreen.set_focus();
    }

    Ok(())
}

#[tauri::command]
async fn frontend_ready(app: tauri::AppHandle) -> Result<(), String> {
    let main_window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;

    main_window
        .show()
        .map_err(|error| format!("failed to show main window: {error}"))?;

    let _ = main_window.set_focus();

    if let Some(splashscreen) = app.get_webview_window("splashscreen") {
        let _ = splashscreen.close();
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            splashscreen_ready,
            frontend_ready,
            commands::app::get_app_info,
            commands::c_project::scan_c_project_workspace,
            commands::c_project::scan_c_project,
            commands::c_project::list_csc_folders,
            commands::call_tree::analyze_call_tree,
            commands::call_tree::export_call_tree_xlsx,
            commands::crc::calculate_crc,
            commands::data_dictionary::analyze_data_dictionary,
            commands::data_dictionary::export_data_dictionary_xlsx,
            commands::reports::reveal_path_in_file_manager,
            commands::storage::app_data_path,
            commands::storage::app_data_reveal,
            commands::storage::app_data_read,
            commands::storage::app_data_write,
            commands::storage::app_data_delete
        ])
        .run(tauri::generate_context!())
        .expect("error while running OROSAITOOLS application");
}