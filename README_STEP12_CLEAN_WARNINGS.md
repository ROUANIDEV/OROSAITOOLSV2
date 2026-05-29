# Step 12 clean compile warnings patch

This is a conservative cleanup patch for the Rust warnings produced after Step 12.

It does not replace your engine files. It edits only the specific warning sources:

1. Retires the legacy duplicate `src-tauri/src/domain/foundation_engine.rs` module by removing its module declaration from `src-tauri/src/domain/mod.rs`.
2. Removes stale `bool_value` usage/imports from the active foundation engine.
3. Converts old private imports in `src-tauri/src/services/foundation_engine/mod.rs` into public re-exports if they still exist.

## Windows

From the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\apply_step12_clean_warnings.ps1
cd src-tauri
cargo check
```

## macOS/Linux/Git Bash

From the repo root:

```bash
bash ./apply_step12_clean_warnings.sh
cd src-tauri
cargo check
```

## Expected result

`cargo check` should finish with:

```text
Finished `dev` profile ...
```

Expected warnings: `0`.

If Rust Analyzer still shows stale diagnostics after cargo is clean, run "Rust Analyzer: Restart Server" in VS Code.
