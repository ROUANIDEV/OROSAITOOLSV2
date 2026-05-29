use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct FoundationRunRequest {
    #[serde(default)]
    pub blocks: Vec<FoundationRuntimeBlock>,
    #[serde(default)]
    pub inputs: Value,
    #[serde(default)]
    pub options: FoundationRunOptions,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FoundationRunOptions {
    #[serde(default = "default_max_loop_iterations")]
    pub max_loop_iterations: usize,
    #[serde(default)]
    pub fail_fast: bool,
    #[serde(default)]
    pub dry_run: bool,
}

impl Default for FoundationRunOptions {
    fn default() -> Self {
        Self {
            max_loop_iterations: default_max_loop_iterations(),
            fail_fast: false,
            dry_run: false,
        }
    }
}

fn default_max_loop_iterations() -> usize {
    1_000
}

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct FoundationRuntimeBlock {
    pub id: String,
    #[serde(rename = "type")]
    pub block_type: String,
    #[serde(default)]
    pub label: String,
    #[serde(default)]
    pub config: Map<String, Value>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FoundationRunResult {
    pub ok: bool,
    pub executed_count: usize,
    pub planned_count: usize,
    pub error_count: usize,
    pub warning_count: usize,
    pub diagnostics: Vec<FoundationRuntimeDiagnostic>,
    pub variables: Map<String, Value>,
    pub constants: Map<String, Value>,
    pub outputs: Map<String, Value>,
    pub functions: Vec<String>,
    pub trace: Vec<FoundationRuntimeTraceItem>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FoundationRuntimeDiagnostic {
    pub severity: FoundationDiagnosticSeverity,
    pub block_id: Option<String>,
    pub field: Option<String>,
    pub message: String,
    pub help: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum FoundationDiagnosticSeverity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FoundationRuntimeTraceItem {
    pub block_id: String,
    pub block_type: String,
    pub status: FoundationRuntimeTraceStatus,
    pub summary: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum FoundationRuntimeTraceStatus {
    Executed,
    Planned,
    Skipped,
    Error,
}

#[derive(Debug, Clone)]
pub struct FunctionDefinition {
    pub name: String,
    pub parameters: Vec<String>,
    pub body_block_ids: Vec<String>,
    pub return_type: String,
}
