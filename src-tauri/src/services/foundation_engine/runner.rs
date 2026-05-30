use serde_json::{Map, Value};

use super::context::FoundationRuntimeContext;
use super::handlers::execute_block;
use super::types::{
    FoundationDiagnosticSeverity, FoundationRunRequest, FoundationRunResult, FoundationRuntimeBlock,
};

fn bool_config(config: &Map<String, Value>, key: &str) -> bool {
    match config.get(key) {
        Some(Value::Bool(value)) => *value,
        Some(Value::String(value)) => matches!(
            value.trim().to_ascii_lowercase().as_str(),
            "true" | "yes" | "1"
        ),
        _ => false,
    }
}

fn should_skip_top_level(block: &FoundationRuntimeBlock) -> bool {
    bool_config(&block.config, "__skipTopLevel")
        || matches!(
            block.config.get("__workflowRole"),
            Some(Value::String(role)) if role == "body"
        )
}

pub fn run_foundation_workflow(request: FoundationRunRequest) -> FoundationRunResult {
    let mut context = FoundationRuntimeContext::default();

    if let Value::Object(inputs) = request.inputs {
        for (key, value) in inputs {
            context.variables.insert(key, value);
        }
    }

    let block_lookup = create_block_lookup(&request.blocks);

    for block in &request.blocks {
        if should_skip_top_level(block) {
            continue;
        }

        execute_block(&mut context, block, &block_lookup, &request.options);

        if request.options.fail_fast && context.has_errors() {
            break;
        }
    }

    let error_count = context
        .diagnostics
        .iter()
        .filter(|diagnostic| diagnostic.severity == FoundationDiagnosticSeverity::Error)
        .count();
    let warning_count = context
        .diagnostics
        .iter()
        .filter(|diagnostic| diagnostic.severity == FoundationDiagnosticSeverity::Warning)
        .count();
    let functions = context.functions.keys().cloned().collect::<Vec<_>>();

    FoundationRunResult {
        ok: error_count == 0,
        executed_count: context.executed_count,
        planned_count: context.planned_count,
        error_count,
        warning_count,
        diagnostics: context.diagnostics,
        variables: context.variables,
        constants: context.constants,
        outputs: context.outputs,
        functions,
        trace: context.trace,
    }
}

pub fn run(request: FoundationRunRequest) -> FoundationRunResult {
    run_foundation_workflow(request)
}

pub fn run_foundation_blocks(blocks: Vec<FoundationRuntimeBlock>) -> FoundationRunResult {
    run_foundation_workflow(FoundationRunRequest {
        blocks,
        inputs: Value::Object(Map::new()),
        options: Default::default(),
    })
}

fn create_block_lookup(blocks: &[FoundationRuntimeBlock]) -> Map<String, Value> {
    blocks
        .iter()
        .filter_map(|block| serde_json::to_value(block).ok().map(|value| (block.id.clone(), value)))
        .collect()
}
