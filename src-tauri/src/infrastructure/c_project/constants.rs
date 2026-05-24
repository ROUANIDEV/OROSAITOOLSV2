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

pub const SOURCE_EXTENSIONS: &[&str] = &["c", "cpp", "cc", "cxx"];
pub const HEADER_EXTENSIONS: &[&str] = &["h", "hpp", "hh", "hxx"];
pub const ASSEMBLY_EXTENSIONS: &[&str] = &["s", "asm"];

pub const SOURCE_FOLDER_NAMES: &[&str] = &["src", "source", "sources"];
pub const INCLUDE_FOLDER_NAMES: &[&str] = &["inc", "include", "includes"];

pub const FILE_PREVIEW_LIMIT: usize = 200;