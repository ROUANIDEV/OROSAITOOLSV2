use serde_json::{Number, Value};

use super::context::FoundationRuntimeContext;
use super::values::{is_truthy, lookup_runtime_value, parse_literal_string};

pub fn evaluate_expression(context: &FoundationRuntimeContext, expression: &str) -> Value {
    let expression = strip_wrapping_parentheses(expression.trim());
    if expression.is_empty() {
        return Value::Null;
    }

    if let Some(value) = parse_literal_string(expression) {
        return value;
    }

    if let Some(value) = evaluate_binary_comparison(context, expression) {
        return value;
    }

    if let Some(value) = evaluate_binary_arithmetic(context, expression) {
        return value;
    }

    lookup_runtime_value(context, expression).unwrap_or_else(|| Value::String(expression.to_string()))
}

pub fn evaluate_condition(context: &FoundationRuntimeContext, expression: &str) -> bool {
    is_truthy(&evaluate_expression(context, expression))
}

fn strip_wrapping_parentheses(expression: &str) -> &str {
    let mut current = expression.trim();
    loop {
        if !(current.starts_with('(') && current.ends_with(')')) {
            return current;
        }
        let mut depth = 0i32;
        let mut wraps = true;
        for (index, character) in current.char_indices() {
            match character {
                '(' => depth += 1,
                ')' => depth -= 1,
                _ => {}
            }
            if depth == 0 && index < current.len() - 1 {
                wraps = false;
                break;
            }
        }
        if !wraps {
            return current;
        }
        current = current[1..current.len() - 1].trim();
    }
}

fn evaluate_binary_comparison(context: &FoundationRuntimeContext, expression: &str) -> Option<Value> {
    const OPS: [&str; 6] = ["==", "!=", ">=", "<=", ">", "<"];
    for op in OPS {
        if let Some(index) = find_top_level_operator(expression, op) {
            let left = evaluate_expression(context, &expression[..index]);
            let right = evaluate_expression(context, &expression[index + op.len()..]);
            return Some(Value::Bool(compare_values(&left, &right, op)));
        }
    }
    None
}

fn evaluate_binary_arithmetic(context: &FoundationRuntimeContext, expression: &str) -> Option<Value> {
    for op in ["+", "-"] {
        if let Some(index) = find_top_level_operator_right_to_left(expression, op) {
            if index == 0 {
                continue;
            }
            return arithmetic_value(
                evaluate_expression(context, &expression[..index]),
                evaluate_expression(context, &expression[index + op.len()..]),
                op,
            );
        }
    }

    for op in ["*", "/", "%"] {
        if let Some(index) = find_top_level_operator_right_to_left(expression, op) {
            return arithmetic_value(
                evaluate_expression(context, &expression[..index]),
                evaluate_expression(context, &expression[index + op.len()..]),
                op,
            );
        }
    }

    None
}

fn arithmetic_value(left: Value, right: Value, op: &str) -> Option<Value> {
    if op == "+" {
        if matches!(left, Value::String(_)) || matches!(right, Value::String(_)) {
            return Some(Value::String(format!("{}{}", value_to_text(&left), value_to_text(&right))));
        }
    }

    let left = as_f64(&left)?;
    let right = as_f64(&right)?;
    let result = match op {
        "+" => left + right,
        "-" => left - right,
        "*" => left * right,
        "/" => {
            if right == 0.0 {
                return None;
            }
            left / right
        }
        "%" => {
            if right == 0.0 {
                return None;
            }
            left % right
        }
        _ => return None,
    };

    Number::from_f64(result).map(Value::Number)
}

fn compare_values(left: &Value, right: &Value, op: &str) -> bool {
    match op {
        "==" => left == right,
        "!=" => left != right,
        ">" | "<" | ">=" | "<=" => match (as_f64(left), as_f64(right)) {
            (Some(left), Some(right)) => match op {
                ">" => left > right,
                "<" => left < right,
                ">=" => left >= right,
                "<=" => left <= right,
                _ => false,
            },
            _ => false,
        },
        _ => false,
    }
}

fn as_f64(value: &Value) -> Option<f64> {
    match value {
        Value::Number(value) => value.as_f64(),
        Value::String(value) => value.trim().parse::<f64>().ok(),
        Value::Bool(value) => Some(if *value { 1.0 } else { 0.0 }),
        _ => None,
    }
}

fn value_to_text(value: &Value) -> String {
    match value {
        Value::String(value) => value.clone(),
        Value::Null => String::new(),
        other => other.to_string(),
    }
}

fn find_top_level_operator(expression: &str, op: &str) -> Option<usize> {
    let mut depth = 0i32;
    let mut in_string = false;
    let mut previous_escape = false;

    for (index, character) in expression.char_indices() {
        if in_string {
            if character == '"' && !previous_escape {
                in_string = false;
            }
            previous_escape = character == '\\' && !previous_escape;
            continue;
        }

        match character {
            '"' => in_string = true,
            '(' | '[' | '{' => depth += 1,
            ')' | ']' | '}' => depth -= 1,
            _ => {
                if depth == 0 && expression[index..].starts_with(op) {
                    return Some(index);
                }
            }
        }
    }

    None
}

fn find_top_level_operator_right_to_left(expression: &str, op: &str) -> Option<usize> {
    let mut matches = Vec::new();
    let mut offset = 0usize;

    while let Some(index) = find_top_level_operator(&expression[offset..], op) {
        let absolute_index = offset + index;
        matches.push(absolute_index);
        offset = absolute_index + op.len();
        if offset >= expression.len() {
            break;
        }
    }

    matches.into_iter().rev().find(|index| {
        let previous = expression[..*index].trim_end().chars().last();
        if op == "-" {
            !matches!(previous, None | Some('(') | Some('+') | Some('-') | Some('*') | Some('/') | Some('%'))
        } else {
            true
        }
    })
}
