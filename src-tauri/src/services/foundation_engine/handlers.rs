use std::cmp::Ordering;

use serde_json::{json, Map, Value};

use super::context::FoundationRuntimeContext;
use super::expressions::{evaluate_condition, evaluate_expression};
use super::template::render_template;
use super::types::{
    FoundationRuntimeBlock, FoundationRuntimeTraceStatus, FoundationRunOptions, FunctionDefinition,
};
use super::values::{
    array_of_strings, coerce_typed_value, number_value, resolve_runtime_value, string_value,
    value_to_key,
};

pub fn execute_block(
    context: &mut FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    block_lookup: &Map<String, Value>,
    options: &FoundationRunOptions,
) {
    let start_error_count = context
        .diagnostics
        .iter()
        .filter(|diagnostic| {
            matches!(
                diagnostic.severity,
                super::types::FoundationDiagnosticSeverity::Error
            )
        })
        .count();

    match block.block_type.as_str() {
        "variable.create" => execute_variable_create(context, block),
        "variable.assign" => execute_variable_assign(context, block),
        "constant.create" => execute_constant_create(context, block),
        "expression.value" => execute_expression_value(context, block),
        "expression.template" => execute_expression_template(context, block),
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
                Some(
                    "Add a Rust handler for this foundation block before using it at runtime."
                        .to_string(),
                ),
            );
            context.trace(
                block.id.clone(),
                block.block_type.clone(),
                FoundationRuntimeTraceStatus::Planned,
                "Unsupported block was planned only.",
            );
        }
    }

    let end_error_count = context
        .diagnostics
        .iter()
        .filter(|diagnostic| {
            matches!(
                diagnostic.severity,
                super::types::FoundationDiagnosticSeverity::Error
            )
        })
        .count();

    if end_error_count > start_error_count {
        context.trace(
            block.id.clone(),
            block.block_type.clone(),
            FoundationRuntimeTraceStatus::Error,
            "Block produced a validation/runtime error.",
        );
    }
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
            chars.all(|char| char == '_' || char.is_ascii_alphanumeric())
        }
        _ => false,
    };

    if !valid {
        context.error(
            Some(block.id.clone()),
            Some(field.to_string()),
            format!("Invalid identifier '{value}'."),
            Some("Use a valid name like projectName, file_count, or total2.".to_string()),
        );
    }

    valid
}

fn expose_named_output(
    context: &mut FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    value: &Value,
) -> Option<String> {
    let Some(name) = string_value(&block.config, "outputName") else {
        return None;
    };

    let name = name.trim().to_string();
    if name.is_empty() {
        return None;
    }

    if !validate_identifier(context, block, "outputName", &name) {
        return None;
    }

    context.variables.insert(name.clone(), value.clone());
    Some(name)
}

fn execute_variable_create(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let name = string_value(&block.config, "name").unwrap_or_else(|| "value".to_string());
    if !validate_identifier(context, block, "name", &name) {
        return;
    }

    let data_type = string_value(&block.config, "dataType").unwrap_or_else(|| "unknown".to_string());
    let raw_value = block
        .config
        .get("initialValue")
        .cloned()
        .unwrap_or(Value::Null);
    let resolved = resolve_runtime_value(context, &raw_value);

    if let Some(value) = coerce_typed_value(context, &block.id, "initialValue", &data_type, resolved) {
        context.variables.insert(name.clone(), value.clone());
        context
            .outputs
            .insert(block.id.clone(), json!({ "value": value, "reference": name }));
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

    let raw_value = block
        .config
        .get("value")
        .or_else(|| block.config.get("expression"))
        .cloned()
        .unwrap_or(Value::Null);
    let value = resolve_runtime_value(context, &raw_value);

    context.variables.insert(name.clone(), value.clone());
    context
        .outputs
        .insert(block.id.clone(), json!({ "assignedValue": value }));
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        format!("Assigned variable '{name}'."),
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
    let raw_value = block.config.get("value").cloned().unwrap_or(Value::Null);
    let resolved = resolve_runtime_value(context, &raw_value);

    if let Some(value) = coerce_typed_value(context, &block.id, "value", &data_type, resolved) {
        context.constants.insert(name.clone(), value.clone());
        context
            .outputs
            .insert(block.id.clone(), json!({ "constant": value, "reference": name }));
        context.trace(
            block.id.clone(),
            block.block_type.clone(),
            FoundationRuntimeTraceStatus::Executed,
            format!("Created constant '{name}' as {data_type}."),
        );
    }
}

fn execute_expression_value(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let expression = string_value(&block.config, "expression").unwrap_or_default();
    let data_type = string_value(&block.config, "dataType").unwrap_or_else(|| "unknown".to_string());
    let value = evaluate_expression(context, &expression);

    if let Some(value) = coerce_typed_value(context, &block.id, "expression", &data_type, value) {
        context
            .outputs
            .insert(block.id.clone(), json!({ "result": value }));
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

    context.outputs.insert(block.id.clone(), json!({ "text": text }));
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        "Rendered template expression.",
    );
}

fn execute_collection_array(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let value = block
        .config
        .get("items")
        .map(|items| resolve_runtime_value(context, items))
        .unwrap_or_else(|| Value::Array(Vec::new()));

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
        _ => context.error(
            Some(block.id.clone()),
            Some("items".to_string()),
            "Array block expects items to be a JSON array.",
            Some("Use [] or [1, 2, 3].".to_string()),
        ),
    }
}

fn execute_collection_list(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let value = block
        .config
        .get("items")
        .map(|items| resolve_runtime_value(context, items))
        .unwrap_or_else(|| Value::Array(Vec::new()));

    match value {
        Value::Array(items) => {
            let list_value = Value::Array(items.clone());
            let reference = expose_named_output(context, block, &list_value);
            context.outputs.insert(
                block.id.clone(),
                json!({ "list": items, "reference": reference }),
            );
            context.trace(
                block.id.clone(),
                block.block_type.clone(),
                FoundationRuntimeTraceStatus::Executed,
                "Created list.",
            );
        }
        _ => context.error(
            Some(block.id.clone()),
            Some("items".to_string()),
            "List block expects items to be a JSON array.",
            Some("Use [\"a\", \"b\"].".to_string()),
        ),
    }
}

fn execute_collection_dictionary(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let entries = block
        .config
        .get("entries")
        .cloned()
        .unwrap_or(Value::Object(Map::new()));
    let resolved = resolve_runtime_value(context, &entries);

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
    let collection = block
        .config
        .get("collection")
        .map(|value| resolve_runtime_value(context, value))
        .unwrap_or(Value::Null);
    let key = block
        .config
        .get("key")
        .map(|value| value_to_key(&resolve_runtime_value(context, value)))
        .unwrap_or_default();
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

    context.outputs.insert(block.id.clone(), json!({ "value": value }));
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        format!("Read collection key/index '{key}'."),
    );
}

fn execute_collection_set(context: &mut FoundationRuntimeContext, block: &FoundationRuntimeBlock) {
    let mut collection = block
        .config
        .get("collection")
        .map(|value| resolve_runtime_value(context, value))
        .unwrap_or_else(|| Value::Object(Map::new()));
    let key = block
        .config
        .get("key")
        .map(|value| value_to_key(&resolve_runtime_value(context, value)))
        .unwrap_or_default();
    let value = block
        .config
        .get("value")
        .map(|value| resolve_runtime_value(context, value))
        .unwrap_or(Value::Null);

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

    context
        .outputs
        .insert(block.id.clone(), json!({ "collection": collection }));
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

fn runtime_reference_name(value: Option<&Value>) -> Option<String> {
    let Some(Value::String(text)) = value else {
        return None;
    };

    let trimmed = text.trim();
    if !trimmed.starts_with("{{") || !trimmed.ends_with("}}") {
        return None;
    }

    let name = trimmed
        .trim_start_matches("{{")
        .trim_end_matches("}}")
        .trim()
        .to_string();

    if name.is_empty() {
        None
    } else {
        Some(name)
    }
}

fn has_enabled_linked_input_token(block: &FoundationRuntimeBlock, token: &str) -> bool {
    let Some(Value::Array(entries)) = block.config.get("linkedInputs") else {
        return false;
    };

    entries.iter().any(|entry| {
        let Value::Object(map) = entry else {
            return false;
        };

        let enabled = map
            .get("enabled")
            .and_then(Value::as_bool)
            .unwrap_or(true);
        let entry_token = map.get("token").and_then(Value::as_str).unwrap_or_default();

        enabled && entry_token == token
    })
}

fn execute_collection_sort(
    context: &mut FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    options: &FoundationRunOptions,
) {
    let raw_collection_value = block
        .config
        .get("collection")
        .or_else(|| block.config.get("items"));
    let collection = raw_collection_value
        .map(|value| resolve_runtime_value(context, value))
        .unwrap_or_else(|| Value::Array(Vec::new()));
    let mode = string_value(&block.config, "mode")
        .unwrap_or_else(|| "number".to_string())
        .trim()
        .to_ascii_lowercase();
    let direction = string_value(&block.config, "direction")
        .unwrap_or_else(|| "asc".to_string())
        .trim()
        .to_ascii_lowercase();

    let Value::Array(mut items) = collection else {
        if let Some(reference_name) = runtime_reference_name(raw_collection_value) {
            let token = format!("{{{{{reference_name}}}}}");
            if options.dry_run || has_enabled_linked_input_token(block, &token) {
                context.info(
                    Some(block.id.clone()),
                    Some("collection".to_string()),
                    format!("Sort collection depends on linked input {token}."),
                    Some("Single-block preview cannot execute upstream blocks. Run Rust Workflow to resolve the connected array/list, or preview the whole workflow.".to_string()),
                );
                context.outputs.insert(
                    block.id.clone(),
                    json!({
                        "pendingInput": token,
                        "reference": reference_name,
                        "status": "waitingForLinkedInput"
                    }),
                );
                context.trace(
                    block.id.clone(),
                    block.block_type.clone(),
                    FoundationRuntimeTraceStatus::Planned,
                    "Sort collection is waiting for a linked array/list input in single-block preview.",
                );
                return;
            }
        }

        context.error(
            Some(block.id.clone()),
            Some("collection".to_string()),
            "Sort collection expects an array or list input.",
            Some("Connect a Create array/list block, then use its output token like {{numbers}}.".to_string()),
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

    context.functions.insert(
        name.clone(),
        FunctionDefinition {
            name: name.clone(),
            parameters,
            body_block_ids,
            return_type,
        },
    );
    context
        .outputs
        .insert(block.id.clone(), json!({ "function": name }));
    context.trace(
        block.id.clone(),
        block.block_type.clone(),
        FoundationRuntimeTraceStatus::Executed,
        format!("Defined function '{}'.", block.config.get("name").and_then(Value::as_str).unwrap_or("run")),
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

    let arguments = match block.config.get("arguments") {
        Some(Value::Array(items)) => items.clone(),
        _ => Vec::new(),
    };

    let saved_variables = context.variables.clone();
    for (index, parameter) in function.parameters.iter().enumerate() {
        let value = arguments
            .get(index)
            .map(|value| resolve_runtime_value(context, value))
            .unwrap_or(Value::Null);
        context.variables.insert(parameter.clone(), value);
    }

    execute_body_block_ids(context, &function.body_block_ids, block_lookup, options);
    context.variables = saved_variables;
    context.outputs.insert(
        block.id.clone(),
        json!({ "result": context.outputs.clone(), "returnType": function.return_type }),
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
    let branch_key = if truthy { "trueBodyBlockIds" } else { "falseBodyBlockIds" };
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
    let expression = string_value(&block.config, "expression").unwrap_or_default();
    let value = evaluate_expression(context, &expression);
    let mut matched_body_ids = array_of_strings(&block.config, "defaultBodyBlockIds");
    let mut matched_case = "default".to_string();

    if let Some(Value::Array(cases)) = block.config.get("cases") {
        for case in cases {
            if let Value::Object(case_map) = case {
                let case_value = case_map.get("value").cloned().unwrap_or(Value::Null);
                if resolve_runtime_value(context, &case_value) == value {
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

fn execute_for_loop(
    context: &mut FoundationRuntimeContext,
    block: &FoundationRuntimeBlock,
    block_lookup: &Map<String, Value>,
    options: &FoundationRunOptions,
) {
    let index_name = string_value(&block.config, "indexName").unwrap_or_else(|| "index".to_string());
    if !validate_identifier(context, block, "indexName", &index_name) {
        return;
    }

    let start = number_value(&block.config, "start", 0.0) as i64;
    let end = number_value(&block.config, "end", 0.0) as i64;
    let step = number_value(&block.config, "step", 1.0) as i64;

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

    while if step > 0 { index < end } else { index > end } {
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

    let items = block
        .config
        .get("items")
        .map(|value| resolve_runtime_value(context, value))
        .unwrap_or_else(|| Value::Array(Vec::new()));
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
