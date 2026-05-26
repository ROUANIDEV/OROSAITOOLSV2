import {
  createJsonStorage,
  createStorageLogger,
  createTauriJsonStorageAdapter,
} from "@/shared/storage";

import type { BuilderWorkspaceStage } from "../builder/components/BuilderWorkspaceTabs";
import type { CustomToolWorkflowEditorSession } from "../workflow/editor/CustomToolWorkflowEditor";
import type { CustomToolTestPanelSession } from "../runtime/components/CustomToolTestPanel";

const CURRENT_BUILDER_SESSION_KEY = "custom_tools.builder_session";

export type CustomToolBuilderSession = {
  schemaVersion: 1;
  activeStage: BuilderWorkspaceStage;
  workflowSessionByDraftId: Record<string, CustomToolWorkflowEditorSession>;
  testSessionByDraftId: Record<string, CustomToolTestPanelSession>;
};

const builderSessionStorage = createJsonStorage<CustomToolBuilderSession | null>({
  key: CURRENT_BUILDER_SESSION_KEY,
  adapter: createTauriJsonStorageAdapter(),
  fallbackData: () => null,
  logger: createStorageLogger("custom-tools-builder-session-storage"),
});

export async function loadCustomToolBuilderSession() {
  return builderSessionStorage.load();
}

export async function saveCustomToolBuilderSession(
  session: CustomToolBuilderSession,
) {
  await builderSessionStorage.save(session);
}

export async function deleteCustomToolBuilderSession() {
  await builderSessionStorage.delete();
}
