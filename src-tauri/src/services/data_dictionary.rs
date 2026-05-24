use crate::domain::data_dictionary::{
    DataDictionaryExportResult,
    DataDictionarySummary,
};

use crate::infrastructure::data_dictionary as data_dictionary_engine;
use crate::shared::blocking::run_blocking;

pub async fn analyze(
    csc_path: String,
) -> Result<DataDictionarySummary, String> {
    run_blocking("Data Dictionary analysis", move || {
        data_dictionary_engine::analyze_data_dictionary_folder(&csc_path)
    })
    .await
}

pub async fn export_xlsx(
    csc_path: String,
) -> Result<DataDictionaryExportResult, String> {
    run_blocking("Data Dictionary export", move || {
        data_dictionary_engine::export_data_dictionary_excel(&csc_path)
    })
    .await
}