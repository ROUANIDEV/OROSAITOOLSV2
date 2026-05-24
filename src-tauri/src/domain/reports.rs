// Reports currently do not need domain models.
//
// The only reports feature right now is opening/revealing a generated report
// path in the operating system file manager. That is infrastructure behavior,
// so the implementation belongs in:
//
// - src-tauri/src/infrastructure/reports/file_manager.rs
//