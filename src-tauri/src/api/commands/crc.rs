use crate::domain::crc::{
    CrcCalculationRequest,
    CrcCalculationResult,
};

use crate::services::crc as service;

#[tauri::command]
pub async fn calculate_crc(
    request: CrcCalculationRequest,
) -> Result<CrcCalculationResult, String> {
    service::calculate(request).await
}