export type ValidationSeverity = "error" | "warning";

export type CustomToolValidationMessage = {
  id: string;
  severity: ValidationSeverity;
  title: string;
  description: string;
};

export type CustomToolValidationResult = {
  messages: CustomToolValidationMessage[];
  errorCount: number;
  warningCount: number;
  canPublish: boolean;
};