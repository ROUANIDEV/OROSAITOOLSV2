pub const IGNORED_DIRS: &[&str] = &[
    ".git",
    ".svn",
    ".hg",
    "node_modules",
    "target",
    "dist",
    "build",
    ".vscode",
    ".idea",
];

pub const SOURCE_EXTENSIONS: &[&str] = &[
    "c",
    "cpp",
    "cc",
    "cxx",
];

pub const IGNORED_CALL_NAMES: &[&str] = &[
    "if",
    "else",
    "switch",
    "while",
    "for",
    "do",
    "sizeof",
    "return",
    "case",
    "break",
    "continue",
    "typedef",
    "struct",
    "enum",
    "union",
    "static",
    "const",
];

pub const FUNCTION_PREVIEW_LIMIT: usize = 100;