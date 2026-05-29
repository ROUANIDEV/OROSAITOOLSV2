use serde_json::Value;

use super::context::FoundationRuntimeContext;
use super::values::{is_truthy, lookup_runtime_value};

pub fn evaluate_expression(context: &FoundationRuntimeContext, expression: &str) -> Value {
    let expression = expression.trim();

    if expression.is_empty() {
        return Value::Null;
    }

    if expression == "true" {
        return Value::Bool(true);
    }

    if expression == "false" {
        return Value::Bool(false);
    }

    if let Ok(number) = expression.parse::<f64>() {
        if let Some(number) = serde_json::Number::from_f64(number) {
            return Value::Number(number);
        }
    }

    if expression.starts_with('"') && expression.ends_with('"') && expression.len() >= 2 {
        return Value::String(expression[1..expression.len() - 1].to_string());
    }

    evaluate_binary_comparison(context, expression)
        .unwrap_or_else(|| lookup_runtime_value(context, expression).unwrap_or_else(|| Value::String(expression.to_string())))
}

pub fn evaluate_condition(context: &FoundationRuntimeContext, expression: &str) -> bool {
    is_truthy(&evaluate_expression(context, expression))
}

fn evaluate_binary_comparison(context: &FoundationRuntimeContext, expression: &str) -> Option<Value> {
    const OPS: [&str; 6] = ["==", "!=", ">=", "<=", ">", "<"];

    for op in OPS {
        if let Some(index) = expression.find(op) {
            let left = evaluate_expression(context, &expression[..index]);
            let right = evaluate_expression(context, &expression[index + op.len()..]);
            return Some(Value::Bool(compare_values(&left, &right, op)));
        }
    }

    None
}

fn compare_values(left: &Value, right: &Value, op: &str) -> bool {
    match op {
        "==" => left == right,
        "!=" => left != right,
        ">" | "<" | ">=" | "<=" => {
            let left_number = left.as_f64();
            let right_number = right.as_f64();

            match (left_number, right_number) {
                (Some(left), Some(right)) => match op {
                    ">" => left > right,
                    "<" => left < right,
                    ">=" => left >= right,
                    "<=" => left <= right,
                    _ => false,
                },
                _ => false,
            }
        }
        _ => false,
    }
}
