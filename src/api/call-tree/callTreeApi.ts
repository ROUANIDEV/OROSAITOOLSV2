import { invokeTauriCommand } from "@/api/tauri/invokeTauriCommand";
import { tauriCommandNames } from "@/api/tauri/tauriCommandNames";

import {
  normalizeCallTreeAnalysisResult,
  normalizeCallTreeExportResult,
} from "@/api/call-tree/callTreeNormalizers";
import type {
  CallTreeAnalysisResult,
  CallTreeExportResult,
} from "@/api/call-tree/callTreeTypes";

export async function analyzeCallTree(
  cscPath: string,
): Promise<CallTreeAnalysisResult> {
  const result = await invokeTauriCommand<unknown>(
    tauriCommandNames.analyzeCallTree,
    { cscPath },
  );

  return normalizeCallTreeAnalysisResult(result);
}

export async function exportCallTreeXlsx(
  cscPath: string,
): Promise<CallTreeExportResult> {
  const result = await invokeTauriCommand<unknown>(
    tauriCommandNames.exportCallTreeXlsx,
    { cscPath },
  );

  return normalizeCallTreeExportResult(result);
}