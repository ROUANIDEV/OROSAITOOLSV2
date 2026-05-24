use std::collections::BTreeMap;

use regex::Regex;

use crate::domain::call_tree::CallTreeCall;

use super::detected_function::DetectedFunction;

use super::function_parser::{
    is_ignored_call_name,
    line_number_at,
};

pub fn detect_call_edges(
    functions: &[DetectedFunction],
) -> Result<Vec<CallTreeCall>, String> {
    let call_regex = Regex::new(
        r"\b(?P<name>[A-Za-z_][A-Za-z0-9_]*)\s*\(",
    )
    .map_err(|error| format!("Failed to build call regex: {error}"))?;

    let mut calls = Vec::new();

    for function in functions {
        detect_function_calls(function, &call_regex, &mut calls);
    }

    sort_calls(&mut calls);
    Ok(calls)
}

fn detect_function_calls(
    function: &DetectedFunction,
    call_regex: &Regex,
    calls: &mut Vec<CallTreeCall>,
) {
    let mut calls_in_function = BTreeMap::new();

    for captures in call_regex.captures_iter(&function.body) {
        let Some(call) = capture_function_call(function, &captures) else {
            continue;
        };

        calls_in_function.entry(call.0).or_insert(call.1);
    }

    for (called_function, call_line) in calls_in_function {
        calls.push(build_call(function, called_function, call_line));
    }
}

fn capture_function_call(
    function: &DetectedFunction,
    captures: &regex::Captures,
) -> Option<(String, usize)> {
    let full_match = captures.get(0)?;
    let name_match = captures.name("name")?;
    let called_function = name_match.as_str().to_string();

    if is_ignored_call_name(&called_function) {
        return None;
    }

    let call_line = function.body_start_line
        + line_number_at(&function.body, full_match.start())
        - 1;

    Some((called_function, call_line))
}

fn build_call(
    function: &DetectedFunction,
    called_function: String,
    call_line: usize,
) -> CallTreeCall {
    CallTreeCall {
        caller: function.name.clone(),
        callee: called_function.clone(),
        calling_function: function.name.clone(),
        called_function,
        file: function.relative_path.clone(),
        file_path: function.file_path.clone(),
        relative_path: function.relative_path.clone(),
        line: call_line,
    }
}

fn sort_calls(calls: &mut [CallTreeCall]) {
    calls.sort_by(|a, b| {
        a.caller
            .cmp(&b.caller)
            .then(a.callee.cmp(&b.callee))
            .then(a.relative_path.cmp(&b.relative_path))
            .then(a.line.cmp(&b.line))
    });
}