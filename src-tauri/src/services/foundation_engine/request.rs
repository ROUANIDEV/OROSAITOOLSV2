use serde_json::{json, Map, Value};

use crate::domain::foundation_engine::FoundationRunRequest;

pub fn parse_request(payload: Value) -> Result<FoundationRunRequest, String> {
    let normalized = normalize_payload(payload);

    serde_json::from_value(normalized)
        .map_err(|error| format!("Invalid foundation engine payload: {error}"))
}

fn normalize_payload(payload: Value) -> Value {
    if payload.get("blocks").is_some() {
        return payload;
    }

    if let Some(block) = payload.get("block") {
        return json!({
            "blocks": [block.clone()],
            "inputs": payload.get("inputs").cloned().unwrap_or_else(|| json!({})),
            "options": payload.get("options").cloned().unwrap_or_else(|| json!({ "dryRun": true }))
        });
    }

    if payload.get("type").is_some() || payload.get("kind").is_some() {
        let block = normalize_single_block(payload.clone());

        return json!({
            "blocks": [block],
            "inputs": payload.get("inputs").cloned().unwrap_or_else(|| json!({})),
            "options": payload.get("options").cloned().unwrap_or_else(|| json!({ "dryRun": true }))
        });
    }

    json!({
        "blocks": [],
        "inputs": {},
        "options": { "dryRun": true }
    })
}

fn normalize_single_block(payload: Value) -> Value {
    let mut block = Map::new();

    block.insert(
        "id".to_string(),
        payload
            .get("id")
            .cloned()
            .unwrap_or_else(|| Value::String("foundation-preview-block".to_string())),
    );

    block.insert(
        "type".to_string(),
        payload
            .get("type")
            .or_else(|| payload.get("kind"))
            .cloned()
            .unwrap_or_else(|| Value::String("expression.value".to_string())),
    );

    block.insert(
        "label".to_string(),
        payload
            .get("label")
            .or_else(|| payload.get("title"))
            .cloned()
            .unwrap_or_else(|| Value::String("Foundation preview".to_string())),
    );

    block.insert(
        "config".to_string(),
        payload
            .get("config")
            .cloned()
            .unwrap_or_else(|| Value::Object(Map::new())),
    );

    Value::Object(block)
}
