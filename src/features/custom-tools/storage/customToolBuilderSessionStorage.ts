import { invoke } from "@tauri-apps/api/core";

import { tauriCommandNames } from "@/api/tauri/tauriCommandNames";

import type { BuilderWorkspaceStage } from "../BuilderWorkspaceTabs";
import type { CustomToolWorkflowEditorSession } from "../workflow/editor/CustomToolWorkflowEditor";
import type { CustomToolTestPanelSession } from "../testRun/CustomToolTestPanel";

const CURRENT_BUILDER_SESSION_KEY = "custom_tools.builder_session";

export type CustomToolBuilderSession = {
  schemaVersion: 1;
  activeStage: BuilderWorkspaceStage;
  workflowSessionByDraftId: Record<string, CustomToolWorkflowEditorSession>;
  testSessionByDraftId: Record<string, CustomToolTestPanelSession>;
};

type AppDataDocument<TData> = {
  schemaVersion: number;
  key: string;
  updatedAtMs: number;
  data: TData;
};

type NullableAppDataDocument<TData> = AppDataDocument<TData> | null;

function logStorageInfo(message: string, error: unknown) {
  console.info(`[custom-tools-builder-session-storage] ${message}`, error);
}

export async function loadCustomToolBuilderSession() {
  try {
    const document = await invoke<
      NullableAppDataDocument<CustomToolBuilderSession>
    >(tauriCommandNames.appDataRead, {
      key: CURRENT_BUILDER_SESSION_KEY,
    });

    return document?.data ?? null;
  } catch (error) {
    logStorageInfo("No saved custom tool builder session found.", error);
    return null;
  }
}

export async function saveCustomToolBuilderSession(
  session: CustomToolBuilderSession,
) {
  await invoke<AppDataDocument<CustomToolBuilderSession>>(
    tauriCommandNames.appDataWrite,
    {
      key: CURRENT_BUILDER_SESSION_KEY,
      data: session,
    },
  );
}

export async function deleteCustomToolBuilderSession() {
  try {
    await invoke(tauriCommandNames.appDataDelete, {
      key: CURRENT_BUILDER_SESSION_KEY,
    });
  } catch (error) {
    logStorageInfo("No custom tool builder session to delete.", error);
  }
}