import { tauriCommandNames } from "@/api/tauri/tauriCommandNames";
import { invokeTauriCommand } from "@/api/tauri/invokeTauriCommand";

export async function sendSplashscreenReadySignal(): Promise<void> {
  await invokeTauriCommand<void>(tauriCommandNames.splashscreenReady);
}

export async function sendFrontendReadySignal(): Promise<void> {
  await invokeTauriCommand<void>(tauriCommandNames.frontendReady);
}