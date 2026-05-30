use serde_json::{json, Map, Number, Value};

use super::context::FoundationRuntimeContext;

pub fn string_value(config: &Map<String, Value>, key: &str) -> Option<String> {
    match config.get(key) {
        Some(Value::String(value)) => Some(value.trim().to_string()),
        Some(Value::Number(value)) => Some(value.to_string()),
        Some(Value::Bool(value)) => Some(value.to_string()),
        _ => None,
    }
    .filter(|value| !value.is_empty())
}

pub fn number_value(config: &Map<String, Value>, key: &str, fallback: f64) -> f64 {
    match config.get(key) {
        Some(Value::Number(value)) => value.as_f64().unwrap_or(fallback),
        Some(Value::String(value)) => value.trim().parse::<f64>().unwrap_or(fallback),
        Some(Value::Bool(value)) => {
            if *value {
                1.0
            } else {
                0.0
            }
        }
        _ => fallback,
    }
}

pub fn array_of_strings(config: &Map<String, Value>, key: &str) -> Vec<String> {
    match config.get(key) {
        Some(Value::Array(items)) => items
            .iter()
            .filter_map(|item| match item {
                Value::String(value) => Some(value.trim().to_string()),
                Value::Number(value) => Some(value.to_string()),
                _ => None,
            })
            .filter(|value| !value.is_empty())
            .collect(),
        Some(Value::String(value)) if !value.trim().is_empty() => value
            .split(',')
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(ToOwned::to_owned)
            .collect(),
        _ => Vec::new(),
    }
}

pub fn lookup_runtime_value(context: &FoundationRuntimeContext, name: &str) -> Option<Value> {
    let normalized = name.trim();
    if normalized.is_empty() {
        return None;
    }

    let normalized = normalized
        .strip_prefix("{{")
        .and_then(|value| value.strip_suffix("}}"))
        .map(str::trim)
        .unwrap_or(normalized)
        .strip_prefix('$')
        .unwrap_or(normalized);

    context
        .variables
        .get(normalized)
        .cloned()
        .or_else(|| context.constants.get(normalized).cloned())
        .or_else(|| context.outputs.get(normalized).cloned())
}

pub fn resolve_runtime_value(context: &FoundationRuntimeContext, value: &Value) -> Value {
    match value {
        Value::String(raw) => resolve_runtime_string(context, raw),
        Value::Array(items) => Value::Array(
            items
                .iter()
                .map(|item| resolve_runtime_value(context, item))
                .collect(),
        ),
        Value::Object(map) => Value::Object(
            map.iter()
                .map(|(key, value)| (key.clone(), resolve_runtime_value(context, value)))
                .collect(),
        ),
        other => other.clone(),
    }
}

pub fn resolve_runtime_string(context: &FoundationRuntimeContext, raw: &str) -> Value {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Value::String(String::new());
    }

    if let Some(value) = lookup_runtime_value(context, trimmed) {
        return value;
    }

    if trimmed.starts_with("{{") && trimmed.ends_with("}}") {
        return lookup_runtime_value(context, trimmed).unwrap_or(Value::Null);
    }

    if let Some(value) = parse_literal_string(trimmed) {
        return value;
    }

    Value::String(raw.to_string())
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
        || (trimmed.starts_with('"') && trimmed.ends_with('"'))
    {
        return serde_json::from_str(trimmed).ok();
    }
    None
}

pub fn coerce_typed_value(
    context: &mut FoundationRuntimeContext,
    block_id: &str,
    field: &str,
    data_type: &str,
    value: Value,
) -> Option<Value> {
    match data_type.trim().to_ascii_lowercase().as_str() {
        "unknown" | "json" | "object" => Some(value),
        "string" | "text" => Some(Value::String(display_value(&value))),
        "number" => coerce_number(value).or_else(|| {
            context.error(
                Some(block_id.to_string()),
                Some(field.to_string()),
                "Expected a number value.",
                Some("Use a number, numeric string, variable reference, or arithmetic expression.".to_string()),
            );
            None
        }),
        "boolean" | "bool" => Some(Value::Bool(is_truthy(&value))),
        "array" | "list" => match value {
            Value::Array(_) => Some(value),
            _ => {
                context.error(
                    Some(block_id.to_string()),
                    Some(field.to_string()),
                    "Expected an array/list value.",
                    Some("Use JSON like [1, 2, 3] or a variable that contains an array.".to_string()),
                );
                None
            }
        },
        "dictionary" => match value {
            Value::Object(_) => Some(value),
            _ => {
                context.error(
                    Some(block_id.to_string()),
                    Some(field.to_string()),
                    "Expected a dictionary/object value.",
                    Some("Use JSON like {\"key\": \"value\"}.".to_string()),
                );
                None
            }
        },
        _ => Some(value),
    }
}

pub fn coerce_number(value: Value) -> Option<Value> {
    match value {
        Value::Number(_) => Some(value),
        Value::String(text) => text
            .trim()
            .parse::<f64>()
            .ok()
            .and_then(Number::from_f64)
            .map(Value::Number),
        Value::Bool(value) => Some(json!(if value { 1 } else { 0 })),
        _ => None,
    }
}

pub fn value_to_key(value: &Value) -> String {
    match value {
        Value::String(text) => text.clone(),
        Value::Number(number) => number.to_string(),
        Value::Bool(boolean) => boolean.to_string(),
        Value::Null => String::new(),
        other => other.to_string(),
    }
}

pub fn display_value(value: &Value) -> String {
    match value {
        Value::String(text) => text.clone(),
        Value::Null => String::new(),
        other => other.to_string(),
    }
}

pub fn is_truthy(value: &Value) -> bool {
    match value {
        Value::Bool(value) => *value,
        Value::Number(value) => value.as_f64().map(|value| value != 0.0).unwrap_or(false),
        Value::String(value) => !value.trim().is_empty() && value.trim() != "false" && value.trim() != "0",
        Value::Array(items) => !items.is_empty(),
        Value::Object(map) => !map.is_empty(),
        Value::Null => false,
    }
}

fn is_number_like(value: &str) -> bool {
    value.parse::<i64>().is_ok() || value.parse::<f64>().is_ok()
}
