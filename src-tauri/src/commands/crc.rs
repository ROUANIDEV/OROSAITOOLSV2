use crate::domain::crc as crc_domain;
use crate::domain::crc::{CrcCalculationRequest, CrcCalculationResult};

#[tauri::command]
pub async fn calculate_crc(
    request: CrcCalculationRequest,
) -> Result<CrcCalculationResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        crc_domain::calculate_crc_blocking(request)
    })
    .await
    .map_err(|error| format!("CRC calculation task failed: {error}"))?
}