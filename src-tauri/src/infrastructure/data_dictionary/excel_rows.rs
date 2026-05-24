use rust_xlsxwriter::Worksheet;

use crate::domain::data_dictionary::{
    ConstantItem,
    DataTypeItem,
    GlobalVariableItem,
};

pub fn write_constant_row(
    worksheet: &mut Worksheet,
    row: u32,
    item: &ConstantItem,
) -> Result<(), String> {
    write_cell(worksheet, row, 0, &item.name)?;
    write_cell(worksheet, row, 1, &item.kind)?;
    write_cell(worksheet, row, 2, &item.value)?;
    write_cell(worksheet, row, 3, &item.relative_path)?;
    write_cell(worksheet, row, 4, item.line.to_string())?;
    write_cell(worksheet, row, 5, item.used_in_sources.to_string())?;

    Ok(())
}

pub fn write_global_variable_row(
    worksheet: &mut Worksheet,
    row: u32,
    item: &GlobalVariableItem,
) -> Result<(), String> {
    write_cell(worksheet, row, 0, &item.name)?;
    write_cell(worksheet, row, 1, &item.data_type)?;
    write_cell(worksheet, row, 2, &item.dimensions)?;
    write_cell(worksheet, row, 3, &item.initializer)?;
    write_cell(worksheet, row, 4, &item.relative_path)?;
    write_cell(worksheet, row, 5, item.line.to_string())?;
    write_cell(worksheet, row, 6, item.used_in_sources.to_string())?;

    Ok(())
}

pub fn write_data_type_row(
    worksheet: &mut Worksheet,
    row: u32,
    item: &DataTypeItem,
) -> Result<(), String> {
    write_cell(worksheet, row, 0, &item.name)?;
    write_cell(worksheet, row, 1, &item.kind)?;
    write_cell(worksheet, row, 2, &item.definition)?;
    write_cell(worksheet, row, 3, &item.relative_path)?;
    write_cell(worksheet, row, 4, item.line.to_string())?;
    write_cell(worksheet, row, 5, item.used_in_sources.to_string())?;

    Ok(())
}

fn write_cell(
    worksheet: &mut Worksheet,
    row: u32,
    column: u16,
    value: impl AsRef<str>,
) -> Result<(), String> {
    worksheet
        .write_string(row, column, value.as_ref())
        .map_err(|error| format!("Failed to write Excel cell: {error}"))?;

    Ok(())
}