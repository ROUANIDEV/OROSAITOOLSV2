import { invoke } from "@tauri-apps/api/core";

import { tauriCommandNames } from "@/api/tauri/tauriCommandNames";
import type { CustomToolManifest } from "../model/customToolTypes";

const CURRENT_DRAFT_KEY = "custom_tools.current_draft";

type AppDataDocument<TData> = {
  schemaVersion: number;
  key: string;
  updatedAtMs: number;
  data: TData;
};

type NullableAppDataDocument<TData> = AppDataDocument<TData> | null;

function logStorageInfo(message: string, error: unknown) {
  console.info(`[custom-tools-storage] ${message}`, error);
}

export async function loadCurrentCustomToolDraft() {
  try {
    const document = await invoke<NullableAppDataDocument<CustomToolManifest>>(
      tauriCommandNames.appDataRead,
      {
        key: CURRENT_DRAFT_KEY,
      },
    );

    return document?.data ?? null;
  } catch (error) {
    logStorageInfo("No saved custom tool draft found.", error);
    return null;
  }
}

export async function saveCurrentCustomToolDraft(draft: CustomToolManifest) {
  await invoke<AppDataDocument<CustomToolManifest>>(
    tauriCommandNames.appDataWrite,
    {
      key: CURRENT_DRAFT_KEY,
      data: draft,
    },
  );
}

export async function deleteCurrentCustomToolDraft() {
  try {
    await invoke<void>(tauriCommandNames.appDataDelete, {
      key: CURRENT_DRAFT_KEY,
    });
  } catch (error) {
    logStorageInfo("No custom tool draft to delete.", error);
  }
}