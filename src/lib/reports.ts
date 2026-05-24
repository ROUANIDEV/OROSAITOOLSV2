import { invoke } from "@tauri-apps/api/core";

export async function revealPathInFileManager(path: string): Promise<void> {
  const cleanPath = path.trim();

  if (!cleanPath) {
    throw new Error("Report path is empty.");
  }

  await invoke("reveal_path_in_file_manager", {
    path: cleanPath,
  });
}