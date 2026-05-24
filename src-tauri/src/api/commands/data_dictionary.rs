use crate::domain::data_dictionary::{
    DataDictionaryExportResult,
    DataDictionarySummary,
};

use crate::services::data_dictionary as service;

#[tauri::command]
pub async fn analyze_data_dictionary(
    csc_path: String,
) -> Result<DataDictionarySummary, String> {
    service::analyze(csc_path).await
}

#[tauri::command]
pub async fn export_data_dictionary_xlsx(
    csc_path: String,
) -> Result<DataDictionaryExportResult, String> {
    service::export_xlsx(csc_path).await
}