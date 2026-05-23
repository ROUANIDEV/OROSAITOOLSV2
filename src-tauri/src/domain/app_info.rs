use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub description: String,
}

impl AppInfo {
    pub fn new() -> Self {
        Self {
            name: "OROSAITOOLS".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            description: "Embedded software engineering toolbox".to_string(),
        }
    }
}
