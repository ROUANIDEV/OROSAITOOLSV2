import { invoke } from "@tauri-apps/api/core";

import { tauriCommandNames } from "@/api/tauri/tauriCommandNames";

import type { AppDataDocument, NullableAppDataDocument } from "./appDataDocument";
import type { JsonStorageAdapter } from "./createJsonStorage";

export function createTauriJsonStorageAdapter(): JsonStorageAdapter {
  return {
    async read<TData>(key: string): Promise<NullableAppDataDocument<TData>> {
      return invoke<AppDataDocument<TData> | null>(tauriCommandNames.appDataRead, {
        key,
      });
    },

    async write<TData>(key: string, data: TData): Promise<void> {
      await invoke<void>(tauriCommandNames.appDataWrite, {
        key,
        data,
      });
    },

    async delete(key: string): Promise<void> {
      await invoke<void>(tauriCommandNames.appDataDelete, {
        key,
      });
    },
  };
}
