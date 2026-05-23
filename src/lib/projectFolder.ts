import { open } from "@tauri-apps/plugin-dialog";

export async function selectProjectFolder(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: "Select C Project Folder",
  });

  if (selected === null) {
    return null;
  }

  if (Array.isArray(selected)) {
    return selected[0] ?? null;
  }

  return selected;
}