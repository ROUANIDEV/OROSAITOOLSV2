use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CallTreeSummary {
    pub root_path: String,
    pub source_files: usize,
    pub function_count: usize,
    pub call_count: usize,
    pub root_function_count: usize,
    pub root_functions: Vec<String>,

    pub functions: Vec<CallTreeFunction>,
    pub calls: Vec<CallTreeCall>,

    pub function_preview: Vec<CallTreeFunction>,
    pub edges: Vec<CallTreeCall>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CallTreeExportResult {
    pub output_path: String,
    pub source_files: usize,
    pub function_count: usize,
    pub call_count: usize,
    pub root_function_count: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CallTreeFunction {
    pub name: String,
    pub function_name: String,
    pub file: String,
    pub file_path: String,
    pub relative_path: String,
    pub line: usize,
    pub calls_count: usize,
    pub called_by_count: usize,
    pub is_root: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CallTreeCall {
    pub caller: String,
    pub callee: String,
    pub calling_function: String,
    pub called_function: String,
    pub file: String,
    pub file_path: String,
    pub relative_path: String,
    pub line: usize,
}