#[derive(Debug, Clone)]
pub struct SourceDocument {
    pub relative_path: String,
    pub content: String,
    pub is_header: bool,
}

#[derive(Debug, Clone)]
pub struct ParsedDictionary {
    pub constants: Vec<ParsedConstant>,
    pub global_variables: Vec<ParsedGlobalVariable>,
    pub data_types: Vec<ParsedDataType>,
}

#[derive(Debug, Clone)]
pub struct ParsedConstant {
    pub name: String,
    pub kind: String,
    pub value: String,
    pub relative_path: String,
    pub line: usize,
}

#[derive(Debug, Clone)]
pub struct ParsedGlobalVariable {
    pub name: String,
    pub data_type: String,
    pub dimensions: String,
    pub initializer: String,
    pub relative_path: String,
    pub line: usize,
}

#[derive(Debug, Clone)]
pub struct ParsedDataType {
    pub name: String,
    pub kind: String,
    pub definition: String,
    pub relative_path: String,
    pub line: usize,
}