use std::path::PathBuf;

use rust_xlsxwriter::{
    Format,
    Workbook,
    Worksheet,
};

use crate::domain::data_dictionary::{
    DataDictionaryExportResult,
    DataDictionarySummary,
};

use super::excel_rows::{
    write_constant_row,
    write_data_type_row,
    write_global_variable_row,
};

use super::path_utils::path_to_string;
use super::scanner::analyze_data_dictionary_folder;

pub fn export_data_dictionary_excel(
    csc_path: &str,
) -> Result<DataDictionaryExportResult, String> {
    let summary = analyze_data_dictionary_folder(csc_path)?;
    let output_path = PathBuf::from(csc_path).join("data_dictionary.xlsx");

    let mut workbook = Workbook::new();
    let header_format = Format::new().set_bold();

    write_constants_sheet(&mut workbook, &header_format, &summary)?;
    write_global_variables_sheet(&mut workbook, &header_format, &summary)?;
    write_data_types_sheet(&mut workbook, &header_format, &summary)?;

    workbook
        .save(&output_path)
        .map_err(|error| format!("Failed to save data_dictionary.xlsx: {error}"))?;

    Ok(DataDictionaryExportResult {
        output_path: path_to_string(&output_path),
        source_files: summary.source_files,
        header_files: summary.header_files,
        constants_count: summary.constants_count,
        global_variables_count: summary.global_variables_count,
        data_types_count: summary.data_types_count,
    })
}

fn write_constants_sheet(
    workbook: &mut Workbook,
    header_format: &Format,
    summary: &DataDictionarySummary,
) -> Result<(), String> {
    let worksheet = workbook.add_worksheet();

    worksheet
        .set_name("Constants")
        .map_err(|error| format!("Failed to name Constants sheet: {error}"))?;

    write_header_row(
        worksheet,
        header_format,
        &["Name", "Kind", "Value", "File", "Line", "Used"],
    )?;

    for (index, item) in summary.constants.iter().enumerate() {
        write_constant_row(worksheet, (index + 1) as u32, item)?;
    }

    Ok(())
}

fn write_global_variables_sheet(
    workbook: &mut Workbook,
    header_format: &Format,
    summary: &DataDictionarySummary,
) -> Result<(), String> {
    let worksheet = workbook.add_worksheet();

    worksheet
        .set_name("Global Variables")
        .map_err(|error| format!("Failed to name Global Variables sheet: {error}"))?;

    write_header_row(
        worksheet,
        header_format,
        &[
            "Name",
            "Data Type",
            "Dimensions",
            "Initializer",
            "File",
            "Line",
            "Used",
        ],
    )?;

    for (index, item) in summary.global_variables.iter().enumerate() {
        write_global_variable_row(worksheet, (index + 1) as u32, item)?;
    }

    Ok(())
}

fn write_data_types_sheet(
    workbook: &mut Workbook,
    header_format: &Format,
    summary: &DataDictionarySummary,
) -> Result<(), String> {
    let worksheet = workbook.add_worksheet();

    worksheet
        .set_name("Data Types")
        .map_err(|error| format!("Failed to name Data Types sheet: {error}"))?;

    write_header_row(
        worksheet,
        header_format,
        &["Name", "Kind", "Definition", "File", "Line", "Used"],
    )?;

    for (index, item) in summary.data_types.iter().enumerate() {
        write_data_type_row(worksheet, (index + 1) as u32, item)?;
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