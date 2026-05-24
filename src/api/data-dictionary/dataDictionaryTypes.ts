export type DataDictionaryConstant = {
  name: string;
  kind: string;
  value: string;
  file: string;
  filePath: string;
  relativePath: string;
  line: number;
  usedInSources: string[];
  used: boolean;
};

export type DataDictionaryGlobalVariable = {
  name: string;
  dataType: string;
  dimensions: string;
  initializer: string;
  file: string;
  filePath: string;
  relativePath: string;
  line: number;
  usedInSources: string[];
  used: boolean;
};

export type DataDictionaryDataType = {
  name: string;
  kind: string;
  definition: string;
  file: string;
  filePath: string;
  relativePath: string;
  line: number;
  usedInSources: string[];
  used: boolean;
};

export type DataDictionaryAnalysisResult = {
  rootPath: string;
  sourceFiles: number;
  headerFiles: number;
  constantsCount: number;
  globalVariablesCount: number;
  dataTypesCount: number;
  constants: DataDictionaryConstant[];
  globalVariables: DataDictionaryGlobalVariable[];
  dataTypes: DataDictionaryDataType[];
};

export type DataDictionaryExportResult = {
  outputPath: string;
  sourceFiles: number;
  headerFiles: number;
  constantsCount: number;
  globalVariablesCount: number;
  dataTypesCount: number;
};