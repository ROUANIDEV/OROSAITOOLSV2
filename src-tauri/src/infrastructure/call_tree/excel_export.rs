use std::path::PathBuf;

use rust_xlsxwriter::{
    Format,
    Workbook,
    Worksheet,
};

use crate::domain::call_tree::{
    CallTreeExportResult,
    CallTreeSummary,
};

use super::excel_rows::{
    write_call_row,
    write_function_row,
};

use super::path_utils::path_to_string;
use super::scanner::analyze_call_tree_folder;

pub fn export_call_tree_excel(
    csc_path: &str,
) -> Result<CallTreeExportResult, String> {
    let summary = analyze_call_tree_folder(csc_path)?;
    let output_path = PathBuf::from(csc_path).join("call_tree.xlsx");

    let mut workbook = Workbook::new();
    let header_format = Format::new().set_bold();

    write_call_tree_sheet(&mut workbook, &header_format, &summary)?;
    write_functions_sheet(&mut workbook, &header_format, &summary)?;
    write_root_functions_sheet(&mut workbook, &header_format, &summary)?;

    workbook
        .save(&output_path)
        .map_err(|error| format!("Failed to save call_tree.xlsx: {error}"))?;

    Ok(CallTreeExportResult {
        output_path: path_to_string(&output_path),
        source_files: summary.source_files,
        function_count: summary.function_count,
        call_count: summary.call_count,
        root_function_count: summary.root_function_count,
    })
}

fn write_call_tree_sheet(
    workbook: &mut Workbook,
    header_format: &Format,
    summary: &CallTreeSummary,
) -> Result<(), String> {
    let worksheet = workbook.add_worksheet();

    worksheet
        .set_name("Call Tree")
        .map_err(|error| format!("Failed to name Call Tree sheet: {error}"))?;

    write_header_row(
        worksheet,
        header_format,
        &["Caller", "Callee", "File", "Line"],
    )?;

    for (index, call) in summary.calls.iter().enumerate() {
        write_call_row(worksheet, (index + 1) as u32, call)?;
    }

    Ok(())
}

fn write_functions_sheet(
    workbook: &mut Workbook,
    header_format: &Format,
    summary: &CallTreeSummary,
) -> Result<(), String> {
    let worksheet = workbook.add_worksheet();

    worksheet
        .set_name("Functions")
        .map_err(|error| format!("Failed to name Functions sheet: {error}"))?;

    write_header_row(
        worksheet,
        header_format,
        &[
            "Function",
            "File",
            "Line",
            "Calls Count",
            "Called By Count",
            "Is Root",
        ],
    )?;

    for (index, function) in summary.functions.iter().enumerate() {
        write_function_row(worksheet, (index + 1) as u32, function)?;
    }

    Ok(())
}

fn write_root_functions_sheet(
    workbook: &mut Workbook,
    header_format: &Format,
    summary: &CallTreeSummary,
) -> Result<(), String> {
    let worksheet = workbook.add_worksheet();

    worksheet
        .set_name("Root Functions")
        .map_err(|error| format!("Failed to name Root Functions sheet: {error}"))?;

    write_header_row(worksheet, header_format, &["Root Function"])?;

    for (index, root_function) in summary.root_functions.iter().enumerate() {
        worksheet
            .write_string((index + 1) as u32, 0, root_function)
            .map_err(|error| format!("Failed to write root function: {error}"))?;
    }

    Ok(())
}

fn write_header_row(
    worksheet: &mut Worksheet,
    header_format: &Format,
    headers: &[&str],
) -> Result<(), String> {
    for (column, header) in headers.iter().enumerate() {
        worksheet
            .write_string_with_format(0, column as u16, *header, header_format)
            .map_err(|error| format!("Failed to write Excel header: {error}"))?;
    }

    Ok(())
}