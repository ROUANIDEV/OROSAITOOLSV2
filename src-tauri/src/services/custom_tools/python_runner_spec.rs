use std::env;

pub struct PythonCommandSpec {
    pub program: String,
    pub args: Vec<String>,
}

pub fn python_command_specs() -> Vec<PythonCommandSpec> {
    let mut specs = Vec::new();

    if let Ok(program) = env::var("OROSAI_PYTHON") {
        if !program.trim().is_empty() {
            specs.push(PythonCommandSpec {
                program,
                args: Vec::new(),
            });
        }
    }

    specs.push(PythonCommandSpec {
        program: "python".to_string(),
        args: Vec::new(),
    });

    specs.push(PythonCommandSpec {
        program: "python3".to_string(),
        args: Vec::new(),
    });

    specs.push(PythonCommandSpec {
        program: "py".to_string(),
        args: vec!["-3".to_string()],
    });

    specs
}
