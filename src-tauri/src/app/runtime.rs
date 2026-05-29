use crate::api::commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::window::splashscreen_ready,
            commands::window::frontend_ready,
            commands::app_info::get_app_info,
            commands::c_project::scan_c_project_workspace,
            commands::c_project::scan_c_project,
            commands::c_project::list_csc_folders,
            commands::call_tree::analyze_call_tree,
            commands::call_tree::export_call_tree_xlsx,
            commands::crc::calculate_crc,
            commands::data_dictionary::analyze_data_dictionary,
            commands::data_dictionary::export_data_dictionary_xlsx,
            commands::custom_tools::custom_tool_scan_files,
            commands::custom_tools::custom_tool_append_text,
            commands::custom_tools::custom_tool_run_python,
            commands::foundation_engine::custom_tool_foundation_run,
            commands::reports::reveal_path_in_file_manager,
            commands::storage::app_data_path,
            commands::storage::app_data_reveal,
            commands::storage::app_data_read,
            commands::storage::app_data_write,
            commands::storage::app_data_delete,
        ])
        .run(tauri::generate_context!())
        .expect("error while running OROSAITOOLS application");
}
