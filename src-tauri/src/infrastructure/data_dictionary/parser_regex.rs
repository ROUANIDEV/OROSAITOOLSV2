use regex::Regex;

pub fn build_define_regex() -> Result<Regex, String> {
    Regex::new(
        r"^\s*#\s*define\s+(?P<name>[A-Za-z_][A-Za-z0-9_]*)(?:\s+(?P<value>.*))?$",
    )
    .map_err(|error| format!("Failed to build #define regex: {error}"))
}

pub fn build_typedef_regex() -> Result<Regex, String> {
    Regex::new(
        r"^\s*typedef\s+.*?\s+(?P<name>[A-Za-z_][A-Za-z0-9_]*)\s*;",
    )
    .map_err(|error| format!("Failed to build typedef regex: {error}"))
}

pub fn build_global_regex() -> Result<Regex, String> {
    Regex::new(
        r"^\s*(?P<type>[A-Za-z_][A-Za-z0-9_\s\*]*?)\s+(?P<name>[A-Za-z_][A-Za-z0-9_]*)(?P<dims>(?:\s*\[[^\]]*\])*)\s*(?:=\s*(?P<init>[^;]*))?;",
    )
    .map_err(|error| format!("Failed to build global variable regex: {error}"))
}