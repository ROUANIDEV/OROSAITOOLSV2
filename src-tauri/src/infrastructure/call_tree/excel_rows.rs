use rust_xlsxwriter::Worksheet;

use crate::domain::call_tree::{
    CallTreeCall,
    CallTreeFunction,
};

pub fn write_call_row(
    worksheet: &mut Worksheet,
    row: u32,
    call: &CallTreeCall,
) -> Result<(), String> {
    worksheet
        .write_string(row, 0, &call.caller)
        .map_err(|error| format!("Failed to write caller: {error}"))?;

    worksheet
        .write_string(row, 1, &call.callee)
        .map_err(|error| format!("Failed to write callee: {error}"))?;

    worksheet
        .write_string(row, 2, &call.relative_path)
        .map_err(|error| format!("Failed to write file path: {error}"))?;

    worksheet
        .write_string(row, 3, call.line.to_string())
        .map_err(|error| format!("Failed to write line: {error}"))?;

    Ok(())
}

pub fn write_function_row(
    worksheet: &mut Worksheet,
    row: u32,
    function: &CallTreeFunction,
) -> Result<(), String> {
    worksheet
        .write_string(row, 0, &function.name)
        .map_err(|error| format!("Failed to write function name: {error}"))?;

    worksheet
        .write_string(row, 1, &function.relative_path)
        .map_err(|error| format!("Failed to write function file: {error}"))?;

    worksheet
        .write_string(row, 2, function.line.to_string())
        .map_err(|error| format!("Failed to write function line: {error}"))?;

    worksheet
        .write_string(row, 3, function.calls_count.to_string())
        .map_err(|error| format!("Failed to write calls count: {error}"))?;

    worksheet
        .write_string(row, 4, function.called_by_count.to_string())
        .map_err(|error| format!("Failed to write called by count: {error}"))?;

    worksheet
        .write_string(row, 5, function.is_root.to_string())
        .map_err(|error| format!("Failed to write root flag: {error}"))?;

    Ok(())
}