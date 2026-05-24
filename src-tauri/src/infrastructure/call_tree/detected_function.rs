#[derive(Debug, Clone)]
pub struct DetectedFunction {
    pub name: String,
    pub file_path: String,
    pub relative_path: String,
    pub line: usize,
    pub body_start_line: usize,
    pub body: String,
}