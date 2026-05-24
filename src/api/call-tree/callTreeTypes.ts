export type CallTreeFunction = {
  name: string;
  functionName: string;
  file: string;
  filePath: string;
  relativePath: string;
  line: number;
  callsCount: number;
  calledByCount: number;
  isRoot: boolean;
};

export type CallTreeCall = {
  caller: string;
  callee: string;
  callingFunction: string;
  calledFunction: string;
  file: string;
  filePath: string;
  relativePath: string;
  line: number;
};

export type CallTreeAnalysisResult = {
  rootPath: string;
  sourceFiles: number;
  functionCount: number;
  callCount: number;
  rootFunctionCount: number;
  rootFunctions: string[];
  functions: CallTreeFunction[];
  calls: CallTreeCall[];

  /**
   * Compatibility aliases for older UI code.
   */
  functionPreview: CallTreeFunction[];
  edges: CallTreeCall[];
};

export type CallTreeExportResult = {
  outputPath: string;
  sourceFiles: number;
  functionCount: number;
  callCount: number;
  rootFunctionCount: number;
};