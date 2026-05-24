import { invokeTauriCommand } from "@/api/tauri/invokeTauriCommand";
import { tauriCommandNames } from "@/api/tauri/tauriCommandNames";

export async function revealPathInFileManager(path: string): Promise<void> {
  const cleanPath = path.trim();

  if (!cleanPath) {
    throw new Error("Report path is empty.");
  }

  await invokeTauriCommand<void>(tauriCommandNames.revealPathInFileManager, {
    path: cleanPath,
  });
}