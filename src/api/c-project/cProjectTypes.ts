export type CscFolder = {
  name: string;
  path: string;
  relativePath: string;
  sourcesPath: string | null;
  includePath: string | null;
  cFiles: number;
  headerFiles: number;
};

export type ScannedFile = {
  path: string;
  relativePath: string;
  fileType: string;
  sizeBytes: number;
};

export type CProjectScanSummary = {
  rootPath: string;
  totalFiles: number;
  cFiles: number;
  headerFiles: number;
  assemblyFiles: number;
  otherFiles: number;
  totalSizeBytes: number;
  ignoredDirectories: string[];
  filePreview: ScannedFile[];
};

export type CProjectWorkspaceScanResult = {
  summary: CProjectScanSummary;
  cscFolders: CscFolder[];
};