import { tauriCommandNames } from "@/api/tauri/tauriCommandNames";
import { invokeTauriCommand } from "@/api/tauri/invokeTauriCommand";

import type { AppInfo } from "@/api/app/appTypes";

export async function getAppInfo(): Promise<AppInfo> {
  return invokeTauriCommand<AppInfo>(tauriCommandNames.getAppInfo);
}