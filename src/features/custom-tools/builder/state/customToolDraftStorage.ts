import {
  createJsonStorage,
  createStorageLogger,
  createTauriJsonStorageAdapter,
} from "@/shared/storage";

import type { CustomToolManifest } from "../../domain/customToolTypes";

const CURRENT_DRAFT_KEY = "custom_tools.current_draft";

const currentDraftStorage = createJsonStorage<CustomToolManifest | null>({
  key: CURRENT_DRAFT_KEY,
  adapter: createTauriJsonStorageAdapter(),
  fallbackData: () => null,
  logger: createStorageLogger("custom-tools-storage"),
});

export async function loadCurrentCustomToolDraft() {
  return currentDraftStorage.load();
}

export async function saveCurrentCustomToolDraft(draft: CustomToolManifest) {
  await currentDraftStorage.save(draft);
}

export async function deleteCurrentCustomToolDraft() {
  await currentDraftStorage.delete();
}
