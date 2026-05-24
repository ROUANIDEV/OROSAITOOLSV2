use crate::domain::call_tree::{
    CallTreeExportResult,
    CallTreeSummary,
};

use crate::infrastructure::call_tree as call_tree_engine;
use crate::shared::blocking::run_blocking;

pub async fn analyze(csc_path: String) -> Result<CallTreeSummary, String> {
    run_blocking("Call Tree analysis", move || {
        call_tree_engine::analyze_call_tree_folder(&csc_path)
    })
    .await
}

pub async fn export_xlsx(
    csc_path: String,
) -> Result<CallTreeExportResult, String> {
    run_blocking("Call Tree export", move || {
        call_tree_engine::export_call_tree_excel(&csc_path)
    })
    .await
}