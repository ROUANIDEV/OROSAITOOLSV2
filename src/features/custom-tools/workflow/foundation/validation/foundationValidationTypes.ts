import type {
  CustomToolBlock,
  CustomToolFoundationBlockType,
} from "../../../domain/customToolTypes";

export type FoundationDiagnosticSeverity = "error" | "warning" | "info";

export type FoundationBlockDiagnostic = {
  id: string;
  severity: FoundationDiagnosticSeverity;
  message: string;
  suggestion?: string;
  field?: string;
  blockId?: string;
  blockType?: CustomToolFoundationBlockType;
};

export type FoundationValidationResult = {
  diagnostics: FoundationBlockDiagnostic[];
  hasErrors: boolean;
  hasWarnings: boolean;
};

export type FoundationBlockConfigValidationContext = {
  blockId: string;
  blockType: CustomToolFoundationBlockType;
  config: Record<string, unknown>;
};

export type FoundationWorkflowValidationContext = {
  blocks: CustomToolBlock[];
};
