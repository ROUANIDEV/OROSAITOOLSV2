use crate::domain::crc::{
    CrcCalculationRequest,
    CrcCalculationResult,
};

use super::formatting::build_result;
use super::input_parser::parse_payload;
use super::math::compute_crc;
use super::parameters::CrcParameters;

pub fn calculate_crc(
    request: CrcCalculationRequest,
) -> Result<CrcCalculationResult, String> {
    let bytes = parse_payload(&request)?;
    let parameters = CrcParameters::from_request(&request)?;
    let value = compute_crc(&bytes, &parameters);

    Ok(build_result(
        value,
        bytes.len(),
        &parameters,
    ))
}