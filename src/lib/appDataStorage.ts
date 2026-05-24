import { invoke } from "@tauri-apps/api/core";

export type AppDataDocument<T> = {
  schemaVersion: number;
  key: string;
  updatedAtMs: number;
  data: T;
};

export async function getAppDataPath(): Promise<string> {
  return await invoke<string>("app_data_path");
}

export async function openAppDataFolder(): Promise<void> {
  const path = await getAppDataPath();

  await invoke<void>("reveal_path_in_file_manager", {
    path,
  });
}

export async function readAppData<T>(key: string): Promise<T | null> {
  const document = await invoke<AppDataDocument<T> | null>("app_data_read", {
    key,
  });

  return document?.data ?? null;
}

export async function writeAppData<T>(
  key: string,
  data: T,
): Promise<AppDataDocument<T>> {
  return await invoke<AppDataDocument<T>>("app_data_write", {
    key,
    data,
  });
}

export async function deleteAppData(key: string): Promise<void> {
  await invoke<void>("app_data_delete", {
    key,
  });
}