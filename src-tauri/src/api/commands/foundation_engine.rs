use crate::services::foundation_engine as service;
use serde_json::Value;

#[tauri::command]
pub async fn custom_tool_foundation_run(
    payload: Option<Value>,
    request: Option<Value>,
) -> Result<Value, String> {
    let raw_payload = payload
        .or(request)
        .ok_or_else(|| "Missing foundation engine payload.".to_string())?;

    let request: service::types::FoundationRunRequest = serde_json::from_value(raw_payload)
        .map_err(|error| format!("Invalid foundation engine payload: {error}"))?;

    let result = service::run_foundation_payload(request).await;

    serde_json::to_value(result)
        .map_err(|error| format!("Failed to serialize foundation engine result: {error}"))
}
