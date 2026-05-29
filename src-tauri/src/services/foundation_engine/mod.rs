mod context;
mod expressions;
mod handlers;
mod runner;
mod template;
pub mod types;
mod values;

use types::{FoundationRunRequest, FoundationRunResult, FoundationRuntimeBlock};

pub async fn run_foundation_payload(payload: FoundationRunRequest) -> FoundationRunResult {
    runner::run_foundation_workflow(payload)
}

#[allow(dead_code)]
pub fn run(payload: FoundationRunRequest) -> FoundationRunResult {
    runner::run(payload)
}

#[allow(dead_code)]
pub fn run_foundation_blocks(blocks: Vec<FoundationRuntimeBlock>) -> FoundationRunResult {
    runner::run_foundation_blocks(blocks)
}

#[allow(dead_code)]
pub fn run_foundation_workflow(payload: FoundationRunRequest) -> FoundationRunResult {
    runner::run_foundation_workflow(payload)
}
