use std::cmp::Ordering;

use serde_json::{json, Map, Value};

use super::context::FoundationRuntimeContext;
use super::expressions::{evaluate_condition, evaluate_expression};
use super::template::render_template;
use super::types::{
    FoundationDiagnosticSeverity, FoundationRunOptions, FoundationRuntimeBlock,
    FoundationRuntimeTraceStatus, FunctionDefinition,
};
use super::values::{
    array_of_strings, bool_value, coerce_typed_value, number_value, resolve_runtime_value,
    string_value, value_to_key,
};

pub fn execute_block(
    context: &mut FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    block_lookup: &Map<String, Value>,
    options: &FoundationRunOptions,
) {
    let start_error_count = count_errors(context);

    match block.block_type.as_str() {
        "io.input" => execute_io_input(context, block),
        "io.output" => execute_io_output(context, block),
        "variable.create" => execute_variable_create(context, block),
        "variable.assign" => execute_variable_assign(context, block),
        "variable.update" => execute_variable_update(context, block),
        "constant.create" => execute_constant_create(context, block),
        "expression.value" => execute_expression_value(context, block),
        "expression.template" => execute_expression_template(context, block),
        "math.operation" => execute_math_operation(context, block),
        "logic.compare" => execute_logic_compare(context, block),
        "collection.array" => execute_collection_array(context, block),
        "collection.list" => execute_collection_list(context, block),
        "collection.dictionary" => execute_collection_dictionary(context, block),
        "collection.get" => execute_collection_get(context, block),
        "collection.set" => execute_collection_set(context, block),
        "collection.sort" => execute_collection_sort(context, block, options),
        "scope.global" | "scope.local" => plan_scope(context, block),
        "function.define" => execute_function_define(context, block),
        "function.call" => execute_function_call(context, block, block_lookup, options),
        "control.if" => execute_if(context, block, block_lookup, options),
        "control.switch" => execute_switch(context, block, block_lookup, options),
        "loop.for" => execute_for_loop(context, block, block_lookup, options),
        "loop.forEach" => execute_for_each_loop(context, block, block_lookup, options),
        "loop.while" => execute_while_loop(context, block, block_lookup, options),
        _ => {
            context.warning(
                Some(block.id.clone()),
                Some("type".to_string()),
                format!("Unsupported foundation block type '{}'.", block.block_type),
                Some("Add a Rust handler for this foundation block before using it at runtime.".to_string()),
            );
            context.trace(
                block.id.clone(),
                block.block_type.clone(),
                FoundationRuntimeTraceStatus::Planned,
                "Unsupported block was planned only.",
            );
        }
    }

    if count_errors(context) > start_error_count {
        context.trace(
            block.id.clone(),
            block.block_type.clone(),
            FoundationRuntimeTraceStatus::Error,
            "Block produced a validation/runtime error.",
        );
    }
}

fn count_errors(context: &FoundationRuntimeContext) -> usize {
    context
        .diagnostics
        .iter()
        .filter(|diagnostic| matches!(diagnostic.severity, FoundationDiagnosticSeverity::Error))
        .count()
}

fn validate_identifier(
    context: &mut FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    field: &str,
    value: &str,
) -> bool {
    let mut chars = value.chars();
    let valid = match chars.next() {
        Some(first) if first == '_' || first.is_ascii_alphabetic() => {
            chars.all(|character| character == '_' || character.is_ascii_alphanumeric())
        }
        _ => false,
    };

    if !valid {
        context.error(
            Some(block.id.clone()),
            Some(field.to_string()),
            format!("Invalid identifier '{value}'."),
            Some("Use a valid name like n, result, file_count, or total2.".to_string()),
        );
    }

    valid
}

fn expose_named_output(
    context: &mut FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    value: &Value,
) -> Option<String> {
    let name = string_value(&block.config, "outputName")
        .or_else(|| string_value(&block.config, "assignTo"))
        .unwrap_or_default()
        .trim()
        .to_string();

    if name.is_empty() {
        return None;
    }

    if !validate_identifier(context, block, "outputName", &name) {
        return None;
    }

    context.variables.insert(name.clone(), value.clone());
    Some(name)
}


fn expose_result_name(
    context: &mut FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    value: &Value,
) -> Option<String> {
    let name = string_value(&block.config, "resultName")
        .or_else(|| string_value(&block.config, "outputName"))
        .or_else(|| string_value(&block.config, "assignTo"))
        .unwrap_or_default()
        .trim()
        .to_string();

    if name.is_empty() {
        return None;
    }

    if !validate_identifier(context, block, "resultName", &name) {
        return None;
    }

    context.variables.insert(name.clone(), value.clone());
    Some(name)
}

fn is_blank_config_value(value: &Value) -> bool {
    match value {
        Value::Null => true,
        Value::String(text) => text.trim().is_empty(),
        _ => false,
    }
}

fn config_expression(context: &FoundationRuntimeContext, block: &FoundationRuntimeBlock, keys: &[&str]) -> Value {
    for key in keys {
        if let Some(value) = block.config.get(*key) {
            if is_blank_config_value(value) {
                continue;
            }

            return match value {
                Value::String(expression) => evaluate_expression(context, expression),
                other => resolve_runtime_value(context, other),
            };
        }
    }

    Value::Null
}

fn default_value_for_data_type(data_type: &str) -> Value {
    match data_type.trim().to_ascii_lowercase().as_str() {
        "number" => json!(0),
        "boolean" | "bool" => json!(false),
        "array" | "list" => json!([]),
        "dictionary" | "object" | "json" => json!({}),
        "string" | "text" => json!(""),
        _ => Value::Null,
    }
}

fn config_expression_or_default(
    context: &FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    keys: &[&str],
    fallback: Value,
) -> Value {
    for key in keys {
        if let Some(value) = block.config.get(*key) {
            if is_blank_config_value(value) {
                continue;
            }

            return match value {
                Value::String(expression) => evaluate_expression(context, expression),
                other => resolve_runtime_value(context, other),
            };
        }
    }

    fallback
}

fn has_non_blank_config_value(config: &Map<String, Value>, keys: &[&str]) -> bool {
    keys.iter()
        .any(|key| config.get(*key).map(|value| !is_blank_config_value(value)).unwrap_or(false))
}

fn numeric_config(
    context: &FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    keys: &[&str],
    fallback: f64,
) -> f64 {
    for key in keys {
        if !block.config.contains_key(*key) {
            continue;
        }

        let value = config_expression(context, block, &[*key]);
        return match value {
            Value::Number(value) => value.as_f64().unwrap_or(fallback),
            Value::String(value) => value.trim().parse::<f64>().unwrap_or(fallback),
            Value::Bool(value) => {
                if value {
                    1.0
                } else {
                    0.0
                }
            }
            _ => fallback,
        };
    }

    fallback
}


fn execute_io_input(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let input_id = string_value(&block.config, "inputId")
        .or_else(|| string_value(&block.config, "name"))
        .unwrap_or_else(|| "input".to_string());

    if !validate_identifier(context, block, "inputId", &input_id) {
        return;
    }

    let data_type = string_value(&block.config, "dataType")
        .or_else(|| string_value(&block.config, "type"))
        .unwrap_or_else(|| "unknown".to_string());

    let raw_value = if let Some(value) = context.variables.get(&input_id) {
        value.clone()
    } else if block.config.contains_key("testValue") {
        config_expression(context, block, &["testValue"])
    } else if block.config.contains_key("defaultValue") {
        config_expression(context, block, &["defaultValue"])
    } else {
        Value::Null
    };

    if let Some(value) = coerce_typed_value(context, &block.id, "value", &data_type, raw_value) {
        context.variables.insert(input_id.clone(), value.clone());
        context.outputs.insert(
            block.id.clone(),
            json!({ "inputId": input_id, "value": value }),
        );
        context.trace(
            block.id.clone(),
            block.block_type.clone(),
            FoundationRuntimeTraceStatus::Executed,
            format!("Read canvas input '{input_id}'."),
        );
    }
}

fn execute_io_output(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let output_id = string_value(&block.config, "outputId")
        .or_else(|| string_value(&block.config, "name"))
        .unwrap_or_else(|| "result".to_string());

    if !validate_identifier(context, block, "outputId", &output_id) {
        return;
    }

    let data_type = string_value(&block.config, "dataType")
        .or_else(|| string_value(&block.config, "type"))
        .unwrap_or_else(|| "unknown".to_string());

    let raw_value = if block.config.contains_key("value") || block.config.contains_key("expression") {
        config_expression(context, block, &["value", "expression"])
    } else {
        Value::Null
    };

    if let Some(value) = coerce_typed_value(context, &block.id, "value", &data_type, raw_value) {
        context.outputs.insert(
            block.id.clone(),
            json!({ "outputId": output_id, "value": value }),
        );
        context.outputs.insert(output_id.clone(), value.clone());
        context.variables.insert(output_id.clone(), value);
        context.trace(
            block.id.clone(),
            block.block_type.clone(),
            FoundationRuntimeTraceStatus::Executed,
            format!("Wrote canvas output '{output_id}'."),
        );
    }
}

fn execute_variable_create(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let name = string_value(&block.config, "name").unwrap_or_else(|| "value".to_string());
    if !validate_identifier(context, block, "name", &name) {
        return;
    }

    let data_type = string_value(&block.config, "dataType").unwrap_or_else(|| "unknown".to_string());
    let value = config_expression_or_default(
        context,
        block,
        &["initialValue", "value"],
        default_value_for_data_type(&data_type),
    );

    if let Some(value) = coerce_typed_value(context, &block.id, "initialValue", &data_type, value) {
        context.variables.insert(name.clone(), value.clone());
        context.outputs.insert(
            block.id.clone(),
            json!({ "value": value, "reference": name }),
        );
        context.trace(
            block.id.clone(),
            block.block_type.clone(),
            FoundationRuntimeTraceStatus::Executed,
            format!("Created variable '{name}' as {data_type}."),
        );
    }
}

fn execute_variable_assign(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let name = string_value(&block.config, "name").unwrap_or_else(|| "value".to_string());
    if !validate_identifier(context, block, "name", &name) {
        return;
    }

    if !context.variables.contains_key(&name) {
        context.warning(
            Some(block.id.clone()),
            Some("name".to_string()),
            format!("Variable '{name}' did not exist and will be created by assignment."),
            Some("Create the variable first when you need strict local/global scope behavior.".to_string()),
        );
    }

    let value = config_expression(context, block, &["expression", "value"]);
    context.variables.insert(name.clone(), value.clone());
    context
        .outputs
        .insert(block.id.clone(), json!({ "assignedValue": value, "reference": name }));
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        format!("Assigned variable '{name}'."),
    );
}

fn default_update_initial_value(operation: &str, data_type: &str) -> Value {
    if matches!(data_type.trim().to_ascii_lowercase().as_str(), "number" | "unknown")
        && matches!(operation, "multiply" | "times" | "*" | "x" | "divide" | "/" | "power" | "pow" | "^")
    {
        return json!(1);
    }

    default_value_for_data_type(data_type)
}

fn execute_variable_update(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let name = string_value(&block.config, "name").unwrap_or_else(|| "result".to_string());
    if !validate_identifier(context, block, "name", &name) {
        return;
    }

    let operation = string_value(&block.config, "operation")
        .or_else(|| string_value(&block.config, "operator"))
        .unwrap_or_else(|| "add".to_string())
        .trim()
        .to_ascii_lowercase();

    let data_type = string_value(&block.config, "dataType").unwrap_or_else(|| "number".to_string());
    let has_existing_variable = context.variables.contains_key(&name);
    let has_manual_start_value = has_non_blank_config_value(
        &block.config,
        &["initialValue", "startValue", "defaultValue"],
    );
    let fallback_start_value = default_update_initial_value(&operation, &data_type);
    let current_value = context.variables.get(&name).cloned().unwrap_or_else(|| {
        config_expression_or_default(
            context,
            block,
            &["initialValue", "startValue", "defaultValue"],
            fallback_start_value.clone(),
        )
    });
    let operand_value = config_expression(context, block, &["operand", "value", "right"]);

    let mut current_number = match value_as_sort_number(&current_value) {
        Some(value) => value,
        None if !has_existing_variable && !has_manual_start_value => {
            value_as_sort_number(&fallback_start_value).unwrap_or(0.0)
        }
        None => {
            context.error(
                Some(block.id.clone()),
                Some("initialValue".to_string()),
                "Stored value must be a number.",
                Some("Use a number start value like 1 for multiplication/factorial or 0 for addition.".to_string()),
            );
            return;
        }
    };

    if !has_existing_variable
        && matches!(operation.as_str(), "multiply" | "times" | "*" | "x" | "divide" | "/" | "power" | "pow" | "^")
        && current_number == 0.0
    {
        current_number = 1.0;
    }

    let Some(operand_number) = value_as_sort_number(&operand_value) else {
        context.error(
            Some(block.id.clone()),
            Some("operand".to_string()),
            "Update value must be a number.",
            Some("Connect a number input, loop index, or number-producing block.".to_string()),
        );
        return;
    };

    let result = match operation.as_str() {
        "add" | "+" => current_number + operand_number,
        "subtract" | "minus" | "-" => current_number - operand_number,
        "multiply" | "times" | "*" | "x" => current_number * operand_number,
        "divide" | "/" => {
            if operand_number == 0.0 {
                context.error(
                    Some(block.id.clone()),
                    Some("operand".to_string()),
                    "Cannot divide by zero.",
                    Some("Connect a non-zero update value.".to_string()),
                );
                return;
            }
            current_number / operand_number
        }
        "modulo" | "mod" | "%" => {
            if operand_number == 0.0 {
                context.error(
                    Some(block.id.clone()),
                    Some("operand".to_string()),
                    "Cannot calculate modulo by zero.",
                    Some("Connect a non-zero update value.".to_string()),
                );
                return;
            }
            current_number % operand_number
        }
        "power" | "pow" | "^" => current_number.powf(operand_number),
        _ => {
            context.error(
                Some(block.id.clone()),
                Some("operation".to_string()),
                format!("Unknown variable update operation '{operation}'."),
                Some("Use add, subtract, multiply, divide, modulo, or power.".to_string()),
            );
            return;
        }
    };

    let result_value = json_number_result(result);
    context.variables.insert(name.clone(), result_value.clone());
    context.outputs.insert(
        block.id.clone(),
        json!({
            "value": result_value,
            "reference": name,
            "operation": operation,
            "operand": operand_value,
        }),
    );
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        format!("Updated variable '{name}'."),
    );
}

fn execute_constant_create(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let name = string_value(&block.config, "name").unwrap_or_else(|| "CONST_VALUE".to_string());
    if !validate_identifier(context, block, "name", &name) {
        return;
    }

    if context.constants.contains_key(&name) {
        context.error(
            Some(block.id.clone()),
            Some("name".to_string()),
            format!("Constant '{name}' already exists."),
            Some("Constants are immutable and cannot be redefined.".to_string()),
        );
        return;
    }

    let data_type = string_value(&block.config, "dataType").unwrap_or_else(|| "unknown".to_string());
    let value = config_expression(context, block, &["value", "initialValue"]);

    if let Some(value) = coerce_typed_value(context, &block.id, "value", &data_type, value) {
        context.constants.insert(name.clone(), value.clone());
        context.outputs.insert(
            block.id.clone(),
            json!({ "constant": value, "reference": name }),
        );
        context.trace(
            block.id.clone(),
            block.block_type.clone(),
            FoundationRuntimeTraceStatus::Executed,
            format!("Created constant '{name}' as {data_type}."),
        );
    }
}

fn execute_expression_value(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let data_type = string_value(&block.config, "dataType").unwrap_or_else(|| "unknown".to_string());
    let value = config_expression(context, block, &["expression", "value"]);

    if let Some(value) = coerce_typed_value(context, &block.id, "expression", &data_type, value) {
        let reference = expose_named_output(context, block, &value);
        context
            .outputs
            .insert(block.id.clone(), json!({ "result": value, "reference": reference }));
        context.trace(
            block.id.clone(),
            block.block_type.clone(),
            FoundationRuntimeTraceStatus::Executed,
            "Evaluated expression.",
        );
    }
}

fn execute_expression_template(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let template = string_value(&block.config, "template").unwrap_or_default();
    let text = render_template(context, &template);
    let value = Value::String(text.clone());
    let reference = expose_named_output(context, block, &value);
    context
        .outputs
        .insert(block.id.clone(), json!({ "text": text, "reference": reference }));
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        "Rendered template expression.",
    );
}



fn json_number_result(value: f64) -> Value {
    if value.is_finite() && value.fract() == 0.0 {
        json!(value as i64)
    } else {
        json!(value)
    }
}

fn execute_math_operation(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let left_value = config_expression(context, block, &["left"]);
    let right_value = config_expression(context, block, &["right"]);

    let Some(left) = value_as_sort_number(&left_value) else {
        context.error(
            Some(block.id.clone()),
            Some("left".to_string()),
            "Math left input must be a number.",
            Some("Connect a number input, loop index, variable, or number-producing math block.".to_string()),
        );
        return;
    };

    let Some(right) = value_as_sort_number(&right_value) else {
        context.error(
            Some(block.id.clone()),
            Some("right".to_string()),
            "Math right input must be a number.",
            Some("Connect a number input, loop index, variable, or number-producing math block.".to_string()),
        );
        return;
    };

    let operator = string_value(&block.config, "operator")
        .unwrap_or_else(|| "add".to_string())
        .trim()
        .to_ascii_lowercase();

    let result = match operator.as_str() {
        "add" | "+" => left + right,
        "subtract" | "minus" | "-" => left - right,
        "multiply" | "times" | "*" | "x" => left * right,
        "divide" | "/" => {
            if right == 0.0 {
                context.error(
                    Some(block.id.clone()),
                    Some("right".to_string()),
                    "Cannot divide by zero.",
                    Some("Connect a non-zero right value before running this operation.".to_string()),
                );
                return;
            }
            left / right
        }
        "modulo" | "mod" | "%" => {
            if right == 0.0 {
                context.error(
                    Some(block.id.clone()),
                    Some("right".to_string()),
                    "Cannot calculate modulo by zero.",
                    Some("Connect a non-zero right value before running this operation.".to_string()),
                );
                return;
            }
            left % right
        }
        "power" | "pow" | "^" => left.powf(right),
        _ => {
            context.error(
                Some(block.id.clone()),
                Some("operator".to_string()),
                format!("Unknown math operator '{operator}'."),
                Some("Use add, subtract, multiply, divide, modulo, or power.".to_string()),
            );
            return;
        }
    };

    let result_value = json_number_result(result);
    let reference = expose_result_name(context, block, &result_value);
    context.outputs.insert(
        block.id.clone(),
        json!({
            "result": result_value,
            "reference": reference,
            "operator": operator,
            "left": left_value,
            "right": right_value,
        }),
    );
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        "Calculated math operation.",
    );
}

fn execute_logic_compare(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let left_value = config_expression(context, block, &["left"]);
    let right_value = config_expression(context, block, &["right"]);
    let operator = string_value(&block.config, "operator")
        .unwrap_or_else(|| "equals".to_string())
        .trim()
        .to_ascii_lowercase();

    let result = match operator.as_str() {
        "equals" | "eq" | "==" => left_value == right_value,
        "not_equals" | "not-equals" | "ne" | "!=" => left_value != right_value,
        "greater_than" | "greater-than" | "gt" | ">" => compare_sort_values(&left_value, &right_value, "auto") == Ordering::Greater,
        "greater_or_equal" | "greater-or-equal" | "gte" | ">=" => {
            let ordering = compare_sort_values(&left_value, &right_value, "auto");
            ordering == Ordering::Greater || ordering == Ordering::Equal
        }
        "less_than" | "less-than" | "lt" | "<" => compare_sort_values(&left_value, &right_value, "auto") == Ordering::Less,
        "less_or_equal" | "less-or-equal" | "lte" | "<=" => {
            let ordering = compare_sort_values(&left_value, &right_value, "auto");
            ordering == Ordering::Less || ordering == Ordering::Equal
        }
        _ => {
            context.error(
                Some(block.id.clone()),
                Some("operator".to_string()),
                format!("Unknown comparison operator '{operator}'."),
                Some("Use equals, not_equals, greater_than, greater_or_equal, less_than, or less_or_equal.".to_string()),
            );
            return;
        }
    };

    let result_value = json!(result);
    let reference = expose_result_name(context, block, &result_value);
    context.outputs.insert(
        block.id.clone(),
        json!({
            "result": result_value,
            "reference": reference,
            "operator": operator,
            "left": left_value,
            "right": right_value,
        }),
    );
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        "Compared two values.",
    );
}

fn execute_collection_array(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let value = config_expression(context, block, &["items", "value"]);
    match value {
        Value::Array(items) => {
            let array_value = Value::Array(items.clone());
            let reference = expose_named_output(context, block, &array_value);
            context.outputs.insert(
                block.id.clone(),
                json!({ "array": items, "reference": reference }),
            );
            context.trace(
                block.id.clone(),
                block.block_type.clone(),
                FoundationRuntimeTraceStatus::Executed,
                "Created array.",
            );
        }
        Value::Null => {
            let array_value = Value::Array(Vec::new());
            let reference = expose_named_output(context, block, &array_value);
            context.outputs.insert(
                block.id.clone(),
                json!({ "array": [], "reference": reference }),
            );
            context.trace(
                block.id.clone(),
                block.block_type.clone(),
                FoundationRuntimeTraceStatus::Executed,
                "Created empty array.",
            );
        }
        _ => context.error(
            Some(block.id.clone()),
            Some("items".to_string()),
            "Array block expects items to be a JSON array.",
            Some("Use [] or [1, 2, 3].".to_string()),
        ),
    }
}

fn execute_collection_list(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    execute_collection_array(context, block);
}

fn execute_collection_dictionary(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let resolved = config_expression(context, block, &["entries", "value"]);
    let dictionary = match resolved {
        Value::Object(map) => map,
        Value::Array(items) => {
            let mut map = Map::new();
            for item in items {
                match item {
                    Value::Object(entry) => {
                        let key = entry.get("key").map(value_to_key).unwrap_or_default();
                        let value = entry.get("value").cloned().unwrap_or(Value::Null);
                        if !key.is_empty() {
                            map.insert(key, value);
                        }
                    }
                    _ => context.warning(
                        Some(block.id.clone()),
                        Some("entries".to_string()),
                        "Ignored malformed dictionary entry.",
                        Some("Use { key, value } entries or a JSON object.".to_string()),
                    ),
                }
            }
            map
        }
        Value::Null => Map::new(),
        _ => {
            context.error(
                Some(block.id.clone()),
                Some("entries".to_string()),
                "Dictionary entries must be a JSON object or an array of { key, value } entries.",
                Some("Use {\"name\": \"value\"} or [{\"key\": \"name\", \"value\": \"value\"}].".to_string()),
            );
            return;
        }
    };

    let dictionary_value = Value::Object(dictionary.clone());
    let reference = expose_named_output(context, block, &dictionary_value);
    context.outputs.insert(
        block.id.clone(),
        json!({ "dictionary": dictionary, "reference": reference }),
    );
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        "Created dictionary.",
    );
}

fn execute_collection_get(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let collection = config_expression(context, block, &["collection", "items"]);
    let key_value = config_expression(context, block, &["key", "index"]);
    let key = value_to_key(&key_value);
    let fallback = block.config.get("fallbackValue").cloned().unwrap_or(Value::Null);

    let value = match collection {
        Value::Array(items) => key
            .parse::<usize>()
            .ok()
            .and_then(|index| items.get(index).cloned())
            .unwrap_or(fallback),
        Value::Object(map) => map.get(&key).cloned().unwrap_or(fallback),
        _ => fallback,
    };

    let reference = expose_named_output(context, block, &value);
    context
        .outputs
        .insert(block.id.clone(), json!({ "value": value, "reference": reference }));
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        format!("Read collection key/index '{key}'."),
    );
}

fn execute_collection_set(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let mut collection = config_expression(context, block, &["collection", "items"]);
    let key = value_to_key(&config_expression(context, block, &["key", "index"]));
    let value = config_expression(context, block, &["value"]);

    match &mut collection {
        Value::Array(items) => match key.parse::<usize>() {
            Ok(index) if index < items.len() => items[index] = value,
            Ok(index) if index == items.len() => items.push(value),
            _ => context.error(
                Some(block.id.clone()),
                Some("key".to_string()),
                "Array/list key must be a valid index.",
                Some("Use 0 for the first item or the list length to append.".to_string()),
            ),
        },
        Value::Object(map) => {
            map.insert(key.clone(), value);
        }
        _ => {
            let mut map = Map::new();
            map.insert(key.clone(), value);
            collection = Value::Object(map);
        }
    }

    let reference = expose_named_output(context, block, &collection);
    context.outputs.insert(
        block.id.clone(),
        json!({ "collection": collection, "reference": reference }),
    );
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        format!("Set collection key/index '{key}'."),
    );
}

fn value_as_sort_number(value: &Value) -> Option<f64> {
    match value {
        Value::Number(number) => number.as_f64(),
        Value::String(text) => text.trim().parse::<f64>().ok(),
        Value::Bool(boolean) => Some(if *boolean { 1.0 } else { 0.0 }),
        _ => None,
    }
}

fn compare_sort_values(left: &Value, right: &Value, mode: &str) -> Ordering {
    match mode {
        "number" => value_as_sort_number(left)
            .unwrap_or_default()
            .partial_cmp(&value_as_sort_number(right).unwrap_or_default())
            .unwrap_or(Ordering::Equal),
        "text" => value_to_key(left).cmp(&value_to_key(right)),
        _ => match (value_as_sort_number(left), value_as_sort_number(right)) {
            (Some(left_number), Some(right_number)) => left_number
                .partial_cmp(&right_number)
                .unwrap_or(Ordering::Equal),
            _ => value_to_key(left).cmp(&value_to_key(right)),
        },
    }
}

fn execute_collection_sort(
    context: &mut FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    _options: &FoundationRunOptions,
) {
    let collection = config_expression(context, block, &["collection", "items", "value"]);
    let mode = string_value(&block.config, "mode")
        .unwrap_or_else(|| "number".to_string())
        .trim()
        .to_ascii_lowercase();
    let direction = string_value(&block.config, "direction")
        .unwrap_or_else(|| "asc".to_string())
        .trim()
        .to_ascii_lowercase();

    let Value::Array(mut items) = collection else {
        context.error(
            Some(block.id.clone()),
            Some("collection".to_string()),
            "Sort collection expects an array or list input.",
            Some("Connect a Create array/list block or use an array variable/reference.".to_string()),
        );
        return;
    };

    if mode == "number" {
        for item in &items {
            if value_as_sort_number(item).is_none() {
                context.error(
                    Some(block.id.clone()),
                    Some("mode".to_string()),
                    format!("Cannot number-sort non-numeric value {}.", item),
                    Some("Use only numbers, numeric strings, booleans, or change sort mode to text/auto.".to_string()),
                );
                return;
            }
        }
    }

    items.sort_by(|left, right| compare_sort_values(left, right, &mode));
    if direction == "desc" || direction == "descending" {
        items.reverse();
    }

    let sorted_value = Value::Array(items.clone());
    let reference = expose_named_output(context, block, &sorted_value);
    context.outputs.insert(
        block.id.clone(),
        json!({
            "sorted": items,
            "array": sorted_value,
            "reference": reference,
            "mode": mode,
            "direction": direction,
        }),
    );
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        "Sorted collection.",
    );
}

fn plan_scope(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let namespace = string_value(&block.config, "namespace").unwrap_or_else(|| "local".to_string());
    context.info(
        Some(block.id.clone()),
        Some("scope".to_string()),
        format!("Scope '{namespace}' is registered for graph semantics."),
        Some("Strict nested scope isolation will be expanded when graph regions/body containers are wired.".to_string()),
    );
    context
        .outputs
        .insert(block.id.clone(), json!({ "scope": namespace }));
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Planned,
        "Scope planned.",
    );
}

fn execute_function_define(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let name = string_value(&block.config, "name").unwrap_or_else(|| "run".to_string());
    if !validate_identifier(context, block, "name", &name) {
        return;
    }

    let parameters = array_of_strings(&block.config, "parameters");
    let body_block_ids = array_of_strings(&block.config, "bodyBlockIds");
    let return_type = string_value(&block.config, "returnType").unwrap_or_else(|| "unknown".to_string());
    let return_expression = string_value(&block.config, "returnExpression")
        .or_else(|| string_value(&block.config, "returnValue"));

    context.functions.insert(
        name.clone(),
        FunctionDefinition {
            name: name.clone(),
            parameters,
            body_block_ids,
            return_type,
            return_expression,
        },
    );
    context
        .outputs
        .insert(block.id.clone(), json!({ "function": name }));
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        format!("Defined function '{name}'."),
    );
}

fn execute_function_call(
    context: &mut FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    block_lookup: &Map<String, Value>,
    options: &FoundationRunOptions,
) {
    let name = string_value(&block.config, "functionName")
        .or_else(|| string_value(&block.config, "name"))
        .unwrap_or_default();

    let Some(function) = context.functions.get(&name).cloned() else {
        context.error(
            Some(block.id.clone()),
            Some("functionName".to_string()),
            format!("Function '{name}' is not defined."),
            Some("Add a Define function block before this call or fix the function name.".to_string()),
        );
        return;
    };

    let arguments = match block.config.get("arguments").or_else(|| block.config.get("args")) {
        Some(Value::Array(items)) => items.clone(),
        Some(value) => vec![value.clone()],
        _ => Vec::new(),
    };

    let saved_variables = context.variables.clone();
    let saved_outputs = context.outputs.clone();

    for (index, parameter) in function.parameters.iter().enumerate() {
        let value = arguments
            .get(index)
            .map(|value| match value {
                Value::String(expression) => evaluate_expression(context, expression),
                other => resolve_runtime_value(context, other),
            })
            .unwrap_or(Value::Null);
        context.variables.insert(parameter.clone(), value);
    }

    execute_body_block_ids(context, &function.body_block_ids, block_lookup, options);

    let return_value = function
        .return_expression
        .as_deref()
        .map(|expression| evaluate_expression(context, expression))
        .unwrap_or_else(|| Value::Object(context.outputs.clone()));

    context.variables = saved_variables;
    context.outputs = saved_outputs;

    let assign_to = string_value(&block.config, "assignTo");
    if let Some(name) = assign_to.as_deref() {
        if validate_identifier(context, block, "assignTo", name) {
            context.variables.insert(name.to_string(), return_value.clone());
        }
    }

    context.outputs.insert(
        block.id.clone(),
        json!({
            "result": return_value,
            "returnType": function.return_type,
            "assignedTo": assign_to,
        }),
    );
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        format!("Called function '{}'.", function.name),
    );
}

fn execute_if(
    context: &mut FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    block_lookup: &Map<String, Value>,
    options: &FoundationRunOptions,
) {
    let condition = string_value(&block.config, "condition").unwrap_or_default();
    let truthy = evaluate_condition(context, &condition);
    let branch_key = if truthy {
        "trueBodyBlockIds"
    } else {
        "falseBodyBlockIds"
    };
    let body_ids = array_of_strings(&block.config, branch_key);

    execute_body_block_ids(context, &body_ids, block_lookup, options);

    context.outputs.insert(
        block.id.clone(),
        json!({ "condition": truthy, "branch": if truthy { "true" } else { "false" } }),
    );
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        format!("If condition evaluated to {truthy}."),
    );
}

fn execute_switch(
    context: &mut FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    block_lookup: &Map<String, Value>,
    options: &FoundationRunOptions,
) {
    let value = config_expression(context, block, &["expression", "value"]);
    let mut matched_body_ids = array_of_strings(&block.config, "defaultBodyBlockIds");
    let mut matched_case = "default".to_string();

    if let Some(Value::Array(cases)) = block.config.get("cases") {
        for case in cases {
            if let Value::Object(case_map) = case {
                let case_value = case_map
                    .get("value")
                    .map(|case_value| resolve_runtime_value(context, case_value))
                    .unwrap_or(Value::Null);
                if case_value == value {
                    matched_case = value_to_key(&case_value);
                    matched_body_ids = match case_map.get("bodyBlockIds") {
                        Some(Value::Array(items)) => items
                            .iter()
                            .filter_map(|item| item.as_str().map(ToOwned::to_owned))
                            .collect(),
                        _ => Vec::new(),
                    };
                    break;
                }
            }
        }
    }

    execute_body_block_ids(context, &matched_body_ids, block_lookup, options);
    context
        .outputs
        .insert(block.id.clone(), json!({ "value": value, "matchedCase": matched_case }));
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        "Switch evaluated.",
    );
}

fn loop_should_continue(index: i64, end: i64, step: i64, inclusive_end: bool) -> bool {
    if step > 0 {
        if inclusive_end {
            index <= end
        } else {
            index < end
        }
    } else if inclusive_end {
        index >= end
    } else {
        index > end
    }
}

fn execute_for_loop(
    context: &mut FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    block_lookup: &Map<String, Value>,
    options: &FoundationRunOptions,
) {
    let index_name = string_value(&block.config, "indexName")
        .or_else(|| string_value(&block.config, "variable"))
        .unwrap_or_else(|| "index".to_string());
    if !validate_identifier(context, block, "indexName", &index_name) {
        return;
    }

    let start = numeric_config(context, block, &["start", "from"], 0.0) as i64;
    let end = numeric_config(context, block, &["end", "to"], 0.0) as i64;
    let step = numeric_config(context, block, &["step"], 1.0) as i64;
    let inclusive_end = bool_value(&block.config, "inclusiveEnd", false)
        || bool_value(&block.config, "inclusive", false);

    if step == 0 {
        context.error(
            Some(block.id.clone()),
            Some("step".to_string()),
            "For loop step cannot be zero.",
            Some("Use 1, -1, or another non-zero integer step.".to_string()),
        );
        return;
    }

    let body_ids = array_of_strings(&block.config, "bodyBlockIds");
    let mut iteration_count = 0usize;
    let mut index = start;

    while loop_should_continue(index, end, step, inclusive_end) {
        if iteration_count >= options.max_loop_iterations {
            context.warning(
                Some(block.id.clone()),
                Some("maxLoopIterations".to_string()),
                "For loop stopped by max loop iteration guard.",
                Some("Increase maxLoopIterations only for trusted workflows.".to_string()),
            );
            break;
        }

        context.variables.insert(index_name.clone(), json!(index));
        execute_body_block_ids(context, &body_ids, block_lookup, options);
        index += step;
        iteration_count += 1;
    }

    context
        .outputs
        .insert(block.id.clone(), json!({ "iterations": iteration_count, "index": index }));
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        format!("For loop executed {iteration_count} iterations."),
    );
}

fn execute_for_each_loop(
    context: &mut FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    block_lookup: &Map<String, Value>,
    options: &FoundationRunOptions,
) {
    let item_name = string_value(&block.config, "itemName").unwrap_or_else(|| "item".to_string());
    let index_name = string_value(&block.config, "indexName").unwrap_or_else(|| "index".to_string());
    if !validate_identifier(context, block, "itemName", &item_name)
        || !validate_identifier(context, block, "indexName", &index_name)
    {
        return;
    }

    let items = config_expression(context, block, &["items", "collection", "value"]);
    let body_ids = array_of_strings(&block.config, "bodyBlockIds");
    let mut iteration_count = 0usize;

    match items {
        Value::Array(items) => {
            for (index, item) in items.into_iter().enumerate() {
                if iteration_count >= options.max_loop_iterations {
                    context.warning(
                        Some(block.id.clone()),
                        Some("maxLoopIterations".to_string()),
                        "For each loop stopped by max loop iteration guard.",
                        Some("Increase maxLoopIterations only for trusted workflows.".to_string()),
                    );
                    break;
                }
                context.variables.insert(item_name.clone(), item);
                context.variables.insert(index_name.clone(), json!(index));
                execute_body_block_ids(context, &body_ids, block_lookup, options);
                iteration_count += 1;
            }
        }
        Value::Object(map) => {
            for (index, (key, item)) in map.into_iter().enumerate() {
                if iteration_count >= options.max_loop_iterations {
                    context.warning(
                        Some(block.id.clone()),
                        Some("maxLoopIterations".to_string()),
                        "For each loop stopped by max loop iteration guard.",
                        Some("Increase maxLoopIterations only for trusted workflows.".to_string()),
                    );
                    break;
                }
                context
                    .variables
                    .insert(item_name.clone(), json!({ "key": key, "value": item }));
                context.variables.insert(index_name.clone(), json!(index));
                execute_body_block_ids(context, &body_ids, block_lookup, options);
                iteration_count += 1;
            }
        }
        _ => context.error(
            Some(block.id.clone()),
            Some("items".to_string()),
            "For each loop requires an array, list, or dictionary.",
            Some("Use items like [1, 2, 3] or a dictionary object.".to_string()),
        ),
    }

    context
        .outputs
        .insert(block.id.clone(), json!({ "iterations": iteration_count }));
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        format!("For each loop executed {iteration_count} iterations."),
    );
}

fn execute_while_loop(
    context: &mut FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    block_lookup: &Map<String, Value>,
    options: &FoundationRunOptions,
) {
    let condition = string_value(&block.config, "condition").unwrap_or_default();
    let max_iterations = number_value(&block.config, "maxIterations", options.max_loop_iterations as f64)
        as usize;
    let max_iterations = max_iterations.min(options.max_loop_iterations);
    let body_ids = array_of_strings(&block.config, "bodyBlockIds");
    let mut iteration_count = 0usize;

    while evaluate_condition(context, &condition) {
        if iteration_count >= max_iterations {
            context.warning(
                Some(block.id.clone()),
                Some("maxIterations".to_string()),
                "While loop stopped by max iteration guard.",
                Some("Make sure the condition changes inside the loop body.".to_string()),
            );
            break;
        }
        execute_body_block_ids(context, &body_ids, block_lookup, options);
        iteration_count += 1;
    }

    context.outputs.insert(
        block.id.clone(),
        json!({ "iterations": iteration_count, "completed": true }),
    );
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        format!("While loop executed {iteration_count} iterations."),
    );
}

fn execute_body_block_ids(
    context: &mut FoundationRuntimeContext,
    body_ids: &[String],
    block_lookup: &Map<String, Value>,
    options: &FoundationRunOptions,
) {
    for block_id in body_ids {
        let Some(value) = block_lookup.get(block_id) else {
            context.warning(
                Some(block_id.clone()),
                Some("bodyBlockIds".to_string()),
                format!("Body block '{block_id}' was not found."),
                Some("Remove the stale bodyBlockId or reconnect the body block.".to_string()),
            );
            continue;
        };

        match serde_json::from_value::<FoundationRuntimeBlock>(value.clone()) {
            Ok(block) => execute_block(context, &block, block_lookup, options),
            Err(error) => context.error(
                Some(block_id.clone()),
                Some("bodyBlockIds".to_string()),
                format!("Could not decode body block '{block_id}': {error}"),
                Some("Check the workflow block payload shape.".to_string()),
            ),
        }
    }
}
