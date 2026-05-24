use crate::domain::crc::{
    CrcCalculationRequest,
    CrcCalculationResult,
};

use crate::infrastructure::crc as crc_engine;
use crate::shared::blocking::run_blocking;

pub async fn calculate(
    request: CrcCalculationRequest,
) -> Result<CrcCalculationResult, String> {
    run_blocking("CRC calculation", move || {
        crc_engine::calculate_crc(request)
    })
    .await
}