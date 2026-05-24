use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CrcCalculationRequest {
    pub payload: String,
    pub input_format: String,
    pub width: u32,
    pub polynomial: String,
    pub init: String,
    pub xor_out: String,
    pub reflect_in: bool,
    pub reflect_out: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CrcCalculationResult {
    pub value: String,
    pub decimal: String,
    pub binary: String,
    pub bytes: usize,
    pub width: u32,
    pub mask: String,
    pub normalized: CrcNormalizedParameters,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CrcNormalizedParameters {
    pub polynomial: String,
    pub init: String,
    pub xor_out: String,
    pub reflected_polynomial: String,
}