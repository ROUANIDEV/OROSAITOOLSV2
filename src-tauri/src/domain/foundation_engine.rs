use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FoundationRunRequest {
    #[serde(default)]
    pub blocks: Vec<FoundationRunBlock>,
    #[serde(default = "default_json_object")]
    pub inputs: Value,
    #[serde(default)]
    pub options: FoundationRunOptions,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FoundationRunOptions {
    #[serde(default = "default_true")]
    pub dry_run: bool,
    #[serde(default = "default_max_iterations")]
    pub max_iterations: u32,
}

impl Default for FoundationRunOptions {
    fn default() -> Self {
        Self {
            dry_run: true,
            max_iterations: default_max_iterations(),
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FoundationRunBlock {
    pub id: String,
    #[serde(rename = "type")]
    pub block_type: String,
    #[serde(default)]
    pub label: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub execution_mode: Option<String>,
    #[serde(default)]
    pub config: Map<String, Value>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FoundationRunResult {
    pub ok: bool,
    pub summary: FoundationRunSummary,
    pub diagnostics: Vec<FoundationDiagnostic>,
    pub steps: Vec<FoundationRunStep>,
    pub outputs: Map<String, Value>,
    pub variables: Map<String, Value>,
    pub constants: Map<String, Value>,
    pub functions: Vec<FoundationFunctionRecord>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FoundationRunSummary {
    pub total_blocks: usize,
    pub executed_blocks: usize,
    pub skipped_blocks: usize,
    pub error_count: usize,
    pub warning_count: usize,
    pub info_count: usize,
    pub dry_run: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FoundationRunStep {
    pub block_id: String,
    pub block_type: String,
    pub label: String,
    pub status: FoundationStepStatus,
    pub inputs: Map<String, Value>,
    pub outputs: Map<String, Value>,
    pub notes: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum FoundationStepStatus {
    Completed,
    Planned,
    Skipped,
    Failed,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FoundationDiagnostic {
    pub severity: FoundationDiagnosticSeverity,
    pub block_id: Option<String>,
    pub block_type: Option<String>,
    pub field: Option<String>,
    pub message: String,
    pub help: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum FoundationDiagnosticSeverity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FoundationFunctionRecord {
    pub name: String,
    pub block_id: String,
    pub parameters: Vec<Value>,
    pub return_type: String,
}

impl FoundationDiagnostic {
    pub fn error(
        block: Option<&FoundationRunBlock>,
        field: impl Into<Option<String>>,
        message: impl Into<String>,
        help: impl Into<Option<String>>,
    ) -> Self {
        Self::new(FoundationDiagnosticSeverity::Error, block, field, message, help)
    }

    pub fn warning(
        block: Option<&FoundationRunBlock>,
        field: impl Into<Option<String>>,
        message: impl Into<String>,
        help: impl Into<Option<String>>,
    ) -> Self {
        Self::new(FoundationDiagnosticSeverity::Warning, block, field, message, help)
    }

    pub fn info(
        block: Option<&FoundationRunBlock>,
        field: impl Into<Option<String>>,
        message: impl Into<String>,
        help: impl Into<Option<String>>,
    ) -> Self {
        Self::new(FoundationDiagnosticSeverity::Info, block, field, message, help)
    }

    fn new(
        severity: FoundationDiagnosticSeverity,
        block: Option<&FoundationRunBlock>,
        field: impl Into<Option<String>>,
        message: impl Into<String>,
        help: impl Into<Option<String>>,
    ) -> Self {
        Self {
            severity,
            block_id: block.map(|candidate| candidate.id.clone()),
            block_type: block.map(|candidate| candidate.block_type.clone()),
            field: field.into(),
            message: message.into(),
            help: help.into(),
        }
    }
}

impl FoundationRunResult {
    pub fn empty(dry_run: bool, total_blocks: usize) -> Self {
        Self {
            ok: true,
            summary: FoundationRunSummary {
                total_blocks,
                executed_blocks: 0,
                skipped_blocks: 0,
                error_count: 0,
                warning_count: 0,
                info_count: 0,
                dry_run,
            },
            diagnostics: Vec::new(),
            steps: Vec::new(),
            outputs: Map::new(),
            variables: Map::new(),
            constants: Map::new(),
            functions: Vec::new(),
        }
    }

    pub fn push_diagnostic(&mut self, diagnostic: FoundationDiagnostic) {
        match diagnostic.severity {
            FoundationDiagnosticSeverity::Error => {
                self.ok = false;
                self.summary.error_count += 1;
            }
            FoundationDiagnosticSeverity::Warning => self.summary.warning_count += 1,
            FoundationDiagnosticSeverity::Info => self.summary.info_count += 1,
        }

        self.diagnostics.push(diagnostic);
    }

    pub fn push_step(&mut self, step: FoundationRunStep) {
        match step.status {
            FoundationStepStatus::Completed | FoundationStepStatus::Planned => {
                self.summary.executed_blocks += 1;
            }
            FoundationStepStatus::Skipped | FoundationStepStatus::Failed => {
                self.summary.skipped_blocks += 1;
            }
        }

        self.steps.push(step);
    }
}

pub fn default_json_object() -> Value {
    Value::Object(Map::new())
}

fn default_true() -> bool {
    true
}

fn default_max_iterations() -> u32 {
    100
}
