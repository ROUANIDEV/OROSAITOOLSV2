use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DataDictionarySummary {
    pub root_path: String,
    pub source_files: usize,
    pub header_files: usize,
    pub constants_count: usize,
    pub global_variables_count: usize,
    pub data_types_count: usize,
    pub constants: Vec<ConstantItem>,
    pub global_variables: Vec<GlobalVariableItem>,
    pub data_types: Vec<DataTypeItem>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DataDictionaryExportResult {
    pub output_path: String,
    pub source_files: usize,
    pub header_files: usize,
    pub constants_count: usize,
    pub global_variables_count: usize,
    pub data_types_count: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConstantItem {
    pub name: String,
    pub kind: String,
    pub value: String,
    pub relative_path: String,
    pub line: usize,
    pub used_in_sources: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalVariableItem {
    pub name: String,
    pub data_type: String,
    pub dimensions: String,
    pub initializer: String,
    pub relative_path: String,
    pub line: usize,
    pub used_in_sources: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DataTypeItem {
    pub name: String,
    pub kind: String,
    pub definition: String,
    pub relative_path: String,
    pub line: usize,
    pub used_in_sources: bool,
}