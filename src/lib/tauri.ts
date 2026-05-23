import { invoke } from "@tauri-apps/api/core";

export type AppInfo = {
  name: string;
  version: string;
  description: string;
};

export async function getAppInfo(): Promise<AppInfo> {
  return invoke<AppInfo>("get_app_info");
}