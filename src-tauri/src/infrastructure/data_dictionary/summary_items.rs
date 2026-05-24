use crate::domain::data_dictionary::{
    ConstantItem,
    DataTypeItem,
    GlobalVariableItem,
};

use super::models::{
    ParsedConstant,
    ParsedDataType,
    ParsedGlobalVariable,
    SourceDocument,
};

use super::usage_detector::is_symbol_used_in_sources;

pub fn build_constants(
    documents: &[SourceDocument],
    constants: Vec<ParsedConstant>,
) -> Vec<ConstantItem> {
    constants
        .into_iter()
        .map(|constant| ConstantItem {
            used_in_sources: is_symbol_used_in_sources(
                documents,
                &constant.name,
            ),
            name: constant.name,
            kind: constant.kind,
            value: constant.value,
            relative_path: constant.relative_path,
            line: constant.line,
        })
        .collect()
}

pub fn build_global_variables(
    documents: &[SourceDocument],
    variables: Vec<ParsedGlobalVariable>,
) -> Vec<GlobalVariableItem> {
    variables
        .into_iter()
        .map(|variable| GlobalVariableItem {
            used_in_sources: is_symbol_used_in_sources(
                documents,
                &variable.name,
            ),
            name: variable.name,
            data_type: variable.data_type,
            dimensions: variable.dimensions,
            initializer: variable.initializer,
            relative_path: variable.relative_path,
            line: variable.line,
        })
        .collect()
}

pub fn build_data_types(
    documents: &[SourceDocument],
    data_types: Vec<ParsedDataType>,
) -> Vec<DataTypeItem> {
    data_types
        .into_iter()
        .map(|data_type| DataTypeItem {
            used_in_sources: is_symbol_used_in_sources(
                documents,
                &data_type.name,
            ),
            name: data_type.name,
            kind: data_type.kind,
            definition: data_type.definition,
            relative_path: data_type.relative_path,
            line: data_type.line,
        })
        .collect()
}