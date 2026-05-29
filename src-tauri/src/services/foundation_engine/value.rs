use serde_json::{Map, Number, Value};

use crate::domain::foundation_engine::FoundationRunBlock;

use super::context::FoundationExecutionContext;

pub fn config_string(config: &Map<String, Value>, key: &str, fallback: &str) -> String {
    config
        .get(key)
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or(fallback)
        .to_string()
}

pub fn config_u32(config: &Map<String, Value>, key: &str, fallback: u32) -> u32 {
    config
        .get(key)
        .and_then(Value::as_u64)
        .and_then(|value| u32::try_from(value).ok())
        .unwrap_or(fallback)
}

pub fn config_i64(config: &Map<String, Value>, key: &str, fallback: i64) -> i64 {
    config
        .get(key)
        .and_then(Value::as_i64)
        .unwrap_or(fallback)
}

pub fn first_config_value(block: &FoundationRunBlock, keys: &[&str]) -> Option<Value> {
    keys.iter()
        .find_map(|key| block.config.get(*key))
        .filter(|value| !value.is_null())
        .cloned()
}

pub fn resolve_runtime_value(value: Value, context: &FoundationExecutionContext) -> Value {
    match value {
        Value::String(raw) => resolve_runtime_string(&raw, context),
        other => other,
    }
}

pub fn resolve_runtime_string(raw: &str, context: &FoundationExecutionContext) -> Value {
    let trimmed = raw.trim();

    if let Some(reference) = trimmed.strip_prefix('$') {
        if let Some(value) = context.lookup_reference(reference) {
            return value;
        }
    }

    parse_literal_string(trimmed).unwrap_or_else(|| Value::String(raw.to_string()))
}

pub fn parse_literal_string(raw: &str) -> Option<Value> {
    let trimmed = raw.trim();

    if trimmed.is_empty() {
        return Some(Value::String(String::new()));
    }

    if matches!(trimmed, "true" | "false" | "null")
        || trimmed.starts_with('{')
        || trimmed.starts_with('[')
        || is_number_like(trimmed)
    {
        return serde_json::from_str(trimmed).ok();
    }

    None
}

pub fn display_value(value: &Value) -> String {
    match value {
        Value::String(text) => text.clone(),
        Value::Null => String::new(),
        other => other.to_string(),
    }
}

pub fn ensure_object(value: Value) -> Map<String, Value> {
    match value {
        Value::Object(map) => map,
        _ => Map::new(),
    }
}

pub fn number_value(value: i64) -> Value {
    Value::Number(Number::from(value))
}

fn is_number_like(value: &str) -> bool {
    if value.is_empty() {
        return false;
    }

    value.parse::<i64>().is_ok() || value.parse::<f64>().is_ok()
}
