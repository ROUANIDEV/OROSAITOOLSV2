use crate::domain::data_dictionary::{
    analyze_data_dictionary_folder, export_data_dictionary_excel,
};

#[tauri::command]
pub async fn analyze_data_dictionary(csc_path: String) -> Result<serde_json::Value, String> {
    let analysis = tauri::async_runtime::spawn_blocking(move || {
        analyze_data_dictionary_folder(&csc_path)
    })
    .await
    .map_err(|err| format!("Data Dictionary analysis task failed: {}", err))??;

    serde_json::to_value(analysis)
        .map_err(|err| format!("Failed to serialize Data Dictionary analysis result: {}", err))
}

#[tauri::command]
pub async fn export_data_dictionary_xlsx(csc_path: String) -> Result<serde_json::Value, String> {
    let export_result = tauri::async_runtime::spawn_blocking(move || {
        export_data_dictionary_excel(&csc_path)
    })
    .await
    .map_err(|err| format!("Data Dictionary export task failed: {}", err))??;

    serde_json::to_value(export_result)
        .map_err(|err| format!("Failed to serialize Data Dictionary export result: {}", err))
}