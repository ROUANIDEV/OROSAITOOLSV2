import { invoke } from "@tauri-apps/api/core";

import type { CustomToolBlock } from "../domain/customToolTypes";

export type FoundationBackendDiagnosticSeverity = "error" | "warning" | "info";

export type FoundationBackendDiagnostic = {
  severity: FoundationBackendDiagnosticSeverity;
  blockId?: string | null;
  field?: string | null;
  message: string;
  help?: string | null;
};

export type FoundationBackendTraceStatus =
  | "executed"
  | "planned"
  | "skipped"
  | "error";

export type FoundationBackendTraceItem = {
  blockId: string;
  blockType: string;
  status: FoundationBackendTraceStatus;
  summary: string;
};

export type FoundationBackendRunOptions = {
  maxLoopIterations?: number;
  maxIterations?: number;
  failFast?: boolean;
  dryRun?: boolean;
};

export type FoundationBackendBlockPayload = Pick<
  CustomToolBlock,
  "id" | "type" | "label" | "config"
>;

export type FoundationBackendRunRequest = {
  blocks?: FoundationBackendBlockPayload[];
  block?: FoundationBackendBlockPayload;
  inputs?: Record<string, unknown>;
  options?: FoundationBackendRunOptions;
};

export type FoundationBackendRunResult = {
  ok: boolean;
  executedCount: number;
  plannedCount: number;
  errorCount: number;
  warningCount: number;
  diagnostics: FoundationBackendDiagnostic[];
  variables: Record<string, unknown>;
  constants: Record<string, unknown>;
  outputs: Record<string, unknown>;
  functions: string[];
  trace: FoundationBackendTraceItem[];
  raw: unknown;
};

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeSeverity(value: unknown): FoundationBackendDiagnosticSeverity {
  if (value === "error" || value === "warning" || value === "info") {
    return value;
  }

  return "info";
}

function normalizeDiagnostics(value: unknown): FoundationBackendDiagnostic[] {
  return asArray<RawRecord>(value).map((diagnostic) => ({
    severity: normalizeSeverity(diagnostic.severity),
    blockId:
      typeof diagnostic.blockId === "string"
        ? diagnostic.blockId
        : typeof diagnostic.block_id === "string"
          ? diagnostic.block_id
          : null,
    field: typeof diagnostic.field === "string" ? diagnostic.field : null,
    message:
      typeof diagnostic.message === "string"
        ? diagnostic.message
        : "Foundation backend returned a diagnostic without a message.",
    help: typeof diagnostic.help === "string" ? diagnostic.help : null,
  }));
}

function normalizeTrace(value: unknown): FoundationBackendTraceItem[] {
  return asArray<RawRecord>(value).map((item) => ({
    blockId:
      typeof item.blockId === "string"
        ? item.blockId
        : typeof item.block_id === "string"
          ? item.block_id
          : "unknown-block",
    blockType:
      typeof item.blockType === "string"
        ? item.blockType
        : typeof item.block_type === "string"
          ? item.block_type
          : "unknown",
    status:
      item.status === "executed" ||
      item.status === "planned" ||
      item.status === "skipped" ||
      item.status === "error"
        ? item.status
        : "planned",
    summary: typeof item.summary === "string" ? item.summary : "No summary.",
  }));
}

function normalizeFoundationBlocks(request: FoundationBackendRunRequest) {
  const blocks = Array.isArray(request.blocks)
    ? request.blocks
    : request.block
      ? [request.block]
      : [];

  return blocks.map((block) => ({
    id: String(block.id),
    type: String(block.type),
    label: String(block.label || block.type),
    config: asRecord(block.config),
  }));
}

function normalizeRunOptions(options: FoundationBackendRunOptions | undefined) {
  return {
    maxLoopIterations:
      options?.maxLoopIterations ?? options?.maxIterations ?? 1_000,
    failFast: options?.failFast ?? false,
  };
}

function normalizeRawResult(rawValue: unknown): FoundationBackendRunResult {
  const raw = asRecord(rawValue);
  const summary = asRecord(raw.summary);

  return {
    ok: raw.ok === true,
    executedCount: asNumber(raw.executedCount, asNumber(summary.executedBlocks)),
    plannedCount: asNumber(raw.plannedCount, asNumber(summary.skippedBlocks)),
    errorCount: asNumber(raw.errorCount, asNumber(summary.errorCount)),
    warningCount: asNumber(raw.warningCount, asNumber(summary.warningCount)),
    diagnostics: normalizeDiagnostics(raw.diagnostics),
    variables: asRecord(raw.variables),
    constants: asRecord(raw.constants),
    outputs: asRecord(raw.outputs),
    functions: asArray<string>(raw.functions),
    trace: normalizeTrace(raw.trace),
    raw: rawValue,
  };
}

export function createFoundationBackendPayload(
  request: FoundationBackendRunRequest,
) {
  const blocks = normalizeFoundationBlocks(request);

  if (blocks.length === 0) {
    throw new Error(
      "No foundation blocks were provided to the Rust preview command.",
    );
  }

  return {
    blocks,
    inputs: asRecord(request.inputs),
    options: normalizeRunOptions(request.options),
  };
}

export async function runFoundationBackendPreview(
  request: FoundationBackendRunRequest,
): Promise<FoundationBackendRunResult> {
  const payload = createFoundationBackendPayload(request);
  const raw = await invoke<unknown>("custom_tool_foundation_run", { payload });

  return normalizeRawResult(raw);
}

export async function runFoundationBlocksPreview(
  blocks: FoundationBackendBlockPayload[],
  options?: FoundationBackendRunOptions,
): Promise<FoundationBackendRunResult> {
  return runFoundationBackendPreview({ blocks, options });
}

export async function runSingleFoundationBlockPreview(
  block: FoundationBackendBlockPayload,
): Promise<FoundationBackendRunResult> {
  return runFoundationBackendPreview({ block });
}
