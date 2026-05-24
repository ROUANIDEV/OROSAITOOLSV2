use std::collections::{BTreeMap, BTreeSet};
use std::path::Path;

use crate::domain::call_tree::{
    CallTreeCall,
    CallTreeFunction,
    CallTreeSummary,
};

use super::constants::FUNCTION_PREVIEW_LIMIT;
use super::detected_function::DetectedFunction;
use super::path_utils::path_to_string;

pub fn build_summary(
    root: &Path,
    source_files_count: usize,
    functions: &[DetectedFunction],
    calls: Vec<CallTreeCall>,
) -> CallTreeSummary {
    let known_names = collect_known_function_names(functions);
    let calls_count = count_calls_by_function(&calls);
    let called_by_count = count_called_by_function(&calls, &known_names);
    let root_functions = find_root_functions(&known_names, &called_by_count);

    let function_records = build_function_records(
        functions,
        &calls_count,
        &called_by_count,
    );

    let function_preview = function_records
        .iter()
        .take(FUNCTION_PREVIEW_LIMIT)
        .cloned()
        .collect();

    CallTreeSummary {
        root_path: path_to_string(root),
        source_files: source_files_count,
        function_count: function_records.len(),
        call_count: calls.len(),
        root_function_count: root_functions.len(),
        root_functions,
        functions: function_records,
        calls: calls.clone(),
        function_preview,
        edges: calls,
    }
}

fn build_function_records(
    functions: &[DetectedFunction],
    calls_count: &BTreeMap<String, usize>,
    called_by_count: &BTreeMap<String, usize>,
) -> Vec<CallTreeFunction> {
    functions
        .iter()
        .map(|function| {
            let calls_count = calls_count.get(&function.name).copied().unwrap_or(0);
            let called_by_count =
                called_by_count.get(&function.name).copied().unwrap_or(0);

            CallTreeFunction {
                name: function.name.clone(),
                function_name: function.name.clone(),
                file: function.relative_path.clone(),
                file_path: function.file_path.clone(),
                relative_path: function.relative_path.clone(),
                line: function.line,
                calls_count,
                called_by_count,
                is_root: called_by_count == 0,
            }
        })
        .collect()
}

fn collect_known_function_names(
    functions: &[DetectedFunction],
) -> BTreeSet<String> {
    functions
        .iter()
        .map(|function| function.name.clone())
        .collect()
}

fn count_calls_by_function(calls: &[CallTreeCall]) -> BTreeMap<String, usize> {
    let mut counts = BTreeMap::new();

    for call in calls {
        *counts.entry(call.caller.clone()).or_insert(0) += 1;
    }

    counts
}

fn count_called_by_function(
    calls: &[CallTreeCall],
    known_names: &BTreeSet<String>,
) -> BTreeMap<String, usize> {
    let mut counts = BTreeMap::new();

    for call in calls {
        if known_names.contains(&call.callee) {
            *counts.entry(call.callee.clone()).or_insert(0) += 1;
        }
    }

    counts
}

fn find_root_functions(
    known_names: &BTreeSet<String>,
    called_by_count: &BTreeMap<String, usize>,
) -> Vec<String> {
    let called_defined = called_by_count
        .keys()
        .cloned()
        .collect::<BTreeSet<_>>();

    let mut root_functions = known_names
        .difference(&called_defined)
        .cloned()
        .collect::<Vec<_>>();

    root_functions.sort();
    root_functions
}