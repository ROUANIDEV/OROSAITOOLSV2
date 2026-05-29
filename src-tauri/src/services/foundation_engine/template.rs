use serde_json::Value;

use super::context::FoundationRuntimeContext;
use super::values::lookup_runtime_value;

pub fn render_template(context: &FoundationRuntimeContext, template: &str) -> String {
    let mut output = String::new();
    let mut remaining = template;

    while let Some(start) = remaining.find("{{") {
        let (before, after_start) = remaining.split_at(start);
        output.push_str(before);

        let after_start = &after_start[2..];
        if let Some(end) = after_start.find("}}") {
            let key = after_start[..end].trim();
            output.push_str(&format_template_value(lookup_runtime_value(context, key)));
            remaining = &after_start[end + 2..];
        } else {
            output.push_str("{{");
            output.push_str(after_start);
            return output;
        }
    }

    output.push_str(remaining);
    output
}

fn format_template_value(value: Option<Value>) -> String {
    match value {
        Some(Value::String(text)) => text,
        Some(Value::Number(number)) => number.to_string(),
        Some(Value::Bool(boolean)) => boolean.to_string(),
        Some(Value::Null) | None => String::new(),
        Some(value) => value.to_string(),
    }
}
