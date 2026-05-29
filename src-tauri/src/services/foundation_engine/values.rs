use serde_json::{Map, Number, Value};

use super::context::FoundationRuntimeContext;

pub fn string_value(config: &Map<String, Value>, key: &str) -> Option<String> {
    config.get(key).and_then(|value| match value {
        Value::String(text) => Some(text.clone()),
        Value::Number(number) => Some(number.to_string()),
        Value::Bool(boolean) => Some(boolean.to_string()),
        _ => None,
    })
}

#[allow(dead_code)]
pub fn bool_value(config: &Map<String, Value>, key: &str, fallback: bool) -> bool {
    config.get(key).map_or(fallback, |value| match value {
        Value::Bool(boolean) => *boolean,
        Value::String(text) => matches!(text.trim().to_ascii_lowercase().as_str(), "true" | "yes" | "1"),
        Value::Number(number) => number.as_i64().unwrap_or_default() != 0,
        _ => fallback,
    })
}

pub fn number_value(config: &Map<String, Value>, key: &str, fallback: f64) -> f64 {
    config.get(key).map_or(fallback, |value| match value {
        Value::Number(number) => number.as_f64().unwrap_or(fallback),
        Value::String(text) => text.trim().parse::<f64>().unwrap_or(fallback),
        _ => fallback,
    })
}

pub fn array_of_strings(config: &Map<String, Value>, key: &str) -> Vec<String> {
    match config.get(key) {
        Some(Value::Array(items)) => items
            .iter()
            .filter_map(|item| match item {
                Value::String(text) => Some(text.clone()),
                _ => None,
            })
            .collect(),
        _ => Vec::new(),
    }
}

pub fn lookup_runtime_value(context: &FoundationRuntimeContext, name: &str) -> Option<Value> {
    context
        .variables
        .get(name)
        .cloned()
        .or_else(|| context.constants.get(name).cloned())
        .or_else(|| context.outputs.get(name).cloned())
}

pub fn resolve_runtime_value(context: &FoundationRuntimeContext, value: &Value) -> Value {
    match value {
        Value::String(text) => {
            let trimmed = text.trim();

            if trimmed.starts_with("{{") && trimmed.ends_with("}}") {
                let name = trimmed
                    .trim_start_matches("{{")
                    .trim_end_matches("}}")
                    .trim();
                return lookup_runtime_value(context, name).unwrap_or(Value::Null);
            }

            lookup_runtime_value(context, trimmed).unwrap_or_else(|| Value::String(text.clone()))
        }
        Value::Array(items) => Value::Array(
            items
                .iter()
                .map(|item| resolve_runtime_value(context, item))
                .collect(),
        ),
        Value::Object(map) => Value::Object(
            map.iter()
                .map(|(key, item)| (key.clone(), resolve_runtime_value(context, item)))
                .collect(),
        ),
        _ => value.clone(),
    }
}

pub fn coerce_typed_value(
    context: &mut FoundationRuntimeContext,
    block_id: &str,
    field: &str,
    data_type: &str,
    value: Value,
) -> Option<Value> {
    match data_type {
        "unknown" | "json" => Some(value),
        "string" => match value {
            Value::String(_) => Some(value),
            Value::Number(number) => Some(Value::String(number.to_string())),
            Value::Bool(boolean) => Some(Value::String(boolean.to_string())),
            Value::Null => Some(Value::String(String::new())),
            _ => {
                context.error(
                    Some(block_id.to_string()),
                    Some(field.to_string()),
                    "Type mismatch: expected string.",
                    Some("Use a text value or change the block data type.".to_string()),
                );
                None
            }
        },
        "number" => match value {
            Value::Number(_) => Some(value),
            Value::String(text) => match text.trim().parse::<f64>() {
                Ok(parsed) => Number::from_f64(parsed).map(Value::Number).or_else(|| {
                    context.error(
                        Some(block_id.to_string()),
                        Some(field.to_string()),
                        "Type mismatch: number value is not finite.",
                        Some("Use a finite number like 12, 12.5, or -1.".to_string()),
                    );
                    None
                }),
                Err(_) => {
                    context.error(
                        Some(block_id.to_string()),
                        Some(field.to_string()),
                        format!("Type mismatch: expected number but received '{text}'."),
                        Some("Use an unquoted number like 15, or change dataType to string.".to_string()),
                    );
                    None
                }
            },
            _ => {
                context.error(
                    Some(block_id.to_string()),
                    Some(field.to_string()),
                    "Type mismatch: expected number.",
                    Some("Use a numeric value or change the block data type.".to_string()),
                );
                None
            }
        },
        "boolean" => match value {
            Value::Bool(_) => Some(value),
            Value::String(text) => match text.trim().to_ascii_lowercase().as_str() {
                "true" => Some(Value::Bool(true)),
                "false" => Some(Value::Bool(false)),
                _ => {
                    context.error(
                        Some(block_id.to_string()),
                        Some(field.to_string()),
                        format!("Type mismatch: expected boolean but received '{text}'."),
                        Some("Use true or false, or change the block data type.".to_string()),
                    );
                    None
                }
            },
            _ => {
                context.error(
                    Some(block_id.to_string()),
                    Some(field.to_string()),
                    "Type mismatch: expected boolean.",
                    Some("Use true/false or change the block data type.".to_string()),
                );
                None
            }
        },
        "array" | "list" => match value {
            Value::Array(_) => Some(value),
            _ => {
                context.error(
                    Some(block_id.to_string()),
                    Some(field.to_string()),
                    format!("Type mismatch: expected {data_type}."),
                    Some("Use a JSON array like [1, 2, 3].".to_string()),
                );
                None
            }
        },
        "dictionary" | "object" => match value {
            Value::Object(_) => Some(value),
            _ => {
                context.error(
                    Some(block_id.to_string()),
                    Some(field.to_string()),
                    format!("Type mismatch: expected {data_type}."),
                    Some("Use a JSON object like {\"key\": \"value\"}.".to_string()),
                );
                None
            }
        },
        other => {
            context.warning(
                Some(block_id.to_string()),
                Some("dataType".to_string()),
                format!("Unknown data type '{other}', keeping raw JSON value."),
                Some("Add this data type to the frontend and Rust type registry before execution.".to_string()),
            );
            Some(value)
        }
    }
}

pub fn value_to_key(value: &Value) -> String {
    match value {
        Value::String(text) => text.clone(),
        Value::Number(number) => number.to_string(),
        Value::Bool(boolean) => boolean.to_string(),
        Value::Null => String::new(),
        _ => value.to_string(),
    }
}

pub fn is_truthy(value: &Value) -> bool {
    match value {
        Value::Bool(boolean) => *boolean,
        Value::Number(number) => number.as_f64().unwrap_or_default() != 0.0,
        Value::String(text) => !text.trim().is_empty() && text.trim() != "false" && text.trim() != "0",
        Value::Array(items) => !items.is_empty(),
        Value::Object(map) => !map.is_empty(),
        Value::Null => false,
    }
}
