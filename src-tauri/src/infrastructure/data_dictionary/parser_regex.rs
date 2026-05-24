use regex::Regex;

pub struct DataTypeRegexes {
    pub typedef_block: Regex,
    pub enum_no_typedef: Regex,
    pub function_pointer_typedef: Regex,
    pub typedef_alias: Regex,
}

pub fn build_define_regex() -> Result<Regex, String> {
    build_regex(
        r"^\s*#\s*define\s+(?P<name>[A-Za-z_][A-Za-z0-9_]*)(?:\s+(?P<value>.*))?$",
        "#define",
    )
}

pub fn build_data_type_regexes() -> Result<DataTypeRegexes, String> {
    Ok(DataTypeRegexes {
        typedef_block: build_regex(
            r"(?s)^\s*typedef\s+(struct|enum|union)\b(?:\s+[A-Za-z_][A-Za-z0-9_]*)?\s*\{.*\}\s*([A-Za-z_][A-Za-z0-9_]*)\s*((?:\s*\[[^\]]*\])*)\s*;\s*$",
            "typedef struct/enum/union",
        )?,
        enum_no_typedef: build_regex(
            r"(?s)^\s*enum\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{.*\}\s*;\s*$",
            "enum without typedef",
        )?,
        function_pointer_typedef: build_regex(
            r"(?s)^\s*typedef\s+.+?\(\s*\*\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*\(.*\)\s*;\s*$",
            "function pointer typedef",
        )?,
        typedef_alias: build_regex(
            r"(?s)^\s*typedef\s+(.+?)\s+([A-Za-z_][A-Za-z0-9_]*)\s*((?:\s*\[[^\]]*\])*)\s*;\s*$",
            "typedef alias",
        )?,
    })
}

fn build_regex(pattern: &str, label: &str) -> Result<Regex, String> {
    Regex::new(pattern).map_err(|error| format!("Failed to build {label} regex: {error}"))
}
