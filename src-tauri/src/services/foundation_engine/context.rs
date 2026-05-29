use std::collections::HashMap;

use serde_json::{Map, Value};

use super::types::{
    FoundationDiagnosticSeverity, FoundationRuntimeDiagnostic, FoundationRuntimeTraceItem,
    FoundationRuntimeTraceStatus, FunctionDefinition,
};

#[derive(Debug, Default)]
pub struct FoundationRuntimeContext {
    pub variables: Map<String, Value>,
    pub constants: Map<String, Value>,
    pub outputs: Map<String, Value>,
    pub functions: HashMap<String, FunctionDefinition>,
    pub diagnostics: Vec<FoundationRuntimeDiagnostic>,
    pub trace: Vec<FoundationRuntimeTraceItem>,
    pub executed_count: usize,
    pub planned_count: usize,
}

impl FoundationRuntimeContext {
    pub fn error(
        &mut self,
        block_id: impl Into<Option<String>>,
        field: impl Into<Option<String>>,
        message: impl Into<String>,
        help: impl Into<Option<String>>,
    ) {
        self.diagnostics.push(FoundationRuntimeDiagnostic {
            severity: FoundationDiagnosticSeverity::Error,
            block_id: block_id.into(),
            field: field.into(),
            message: message.into(),
            help: help.into(),
        });
    }

    pub fn warning(
        &mut self,
        block_id: impl Into<Option<String>>,
        field: impl Into<Option<String>>,
        message: impl Into<String>,
        help: impl Into<Option<String>>,
    ) {
        self.diagnostics.push(FoundationRuntimeDiagnostic {
            severity: FoundationDiagnosticSeverity::Warning,
            block_id: block_id.into(),
            field: field.into(),
            message: message.into(),
            help: help.into(),
        });
    }

    pub fn info(
        &mut self,
        block_id: impl Into<Option<String>>,
        field: impl Into<Option<String>>,
        message: impl Into<String>,
        help: impl Into<Option<String>>,
    ) {
        self.diagnostics.push(FoundationRuntimeDiagnostic {
            severity: FoundationDiagnosticSeverity::Info,
            block_id: block_id.into(),
            field: field.into(),
            message: message.into(),
            help: help.into(),
        });
    }

    pub fn trace(
        &mut self,
        block_id: impl Into<String>,
        block_type: impl Into<String>,
        status: FoundationRuntimeTraceStatus,
        summary: impl Into<String>,
    ) {
        match status {
            FoundationRuntimeTraceStatus::Executed => self.executed_count += 1,
            FoundationRuntimeTraceStatus::Planned => self.planned_count += 1,
            FoundationRuntimeTraceStatus::Skipped | FoundationRuntimeTraceStatus::Error => {}
        }

        self.trace.push(FoundationRuntimeTraceItem {
            block_id: block_id.into(),
            block_type: block_type.into(),
            status,
            summary: summary.into(),
        });
    }

    pub fn has_errors(&self) -> bool {
        self.diagnostics
            .iter()
            .any(|diagnostic| diagnostic.severity == FoundationDiagnosticSeverity::Error)
    }
}
