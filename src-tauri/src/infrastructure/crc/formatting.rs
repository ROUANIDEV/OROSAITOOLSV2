use crate::domain::crc::CrcCalculationResult;

use super::parameters::CrcParameters;

pub fn build_result(
    value: u64,
    bytes_len: usize,
    params: &CrcParameters,
) -> CrcCalculationResult {
    CrcCalculationResult {
        value: format_hex(value, params.width),
        decimal: value.to_string(),
        binary: format_binary(value, params.width),
        bytes: bytes_len,
        width: params.width,
        mask: format_hex(params.mask, params.width),
        normalized: params.normalized(),
    }
}

fn format_hex(value: u64, width: u32) -> String {
    let digits = ((width + 3) / 4) as usize;
    format!("0x{:0digits$X}", value)
}

fn format_binary(value: u64, width: u32) -> String {
    let bits = width as usize;
    format!("0b{:0bits$b}", value)
}