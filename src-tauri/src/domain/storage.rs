use serde::{Deserialize, Serialize};
use serde_json::Value;

pub const CURRENT_SCHEMA_VERSION: u16 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppDataDocument {
    pub schema_version: u16,
    pub key: String,
    pub updated_at_ms: u64,
    pub data: Value,
}

impl AppDataDocument {
    pub fn new(key: String, updated_at_ms: u64, data: Value) -> Self {
        Self {
            schema_version: CURRENT_SCHEMA_VERSION,
            key,
            updated_at_ms,
            data,
        }
    }
}